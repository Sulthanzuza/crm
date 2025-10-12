const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const SalesTarget = require('../models/SalesTarget');
const Member = require('../models/Member');
const Lead = require('../models/Lead');
const Invoice = require('../models/Invoices');
const Quote = require('../models/Quote');
const ShareGp = require('../models/ShareGp');


const convertToAED = (amount, currency) => {
    if (amount === null || isNaN(amount)) return 0;
    const upperCaseCurrency = currency ? currency.toUpperCase() : 'AED';

    const rates = {
        USD: 3.67,
        INR: 83.0,
        SAR: 3.67,
        AED: 1,
        QAR: 3.64,
        KWD: 12.04,
        BHD: 9.75,
        OMR: 9.53,
        EUR: 4.00,
        GBP: 4.64,
    };

    const rate = rates[upperCaseCurrency];
    if (!rate) return amount; 

    return amount * rate;
};




router.get('/members', authenticateToken, async (req, res) => {
    if (!isAdmin(req)) return res.status(403).json({ success: false, message: 'Forbidden' });
    try {
        const members = await Member.findAll({
            attributes: ['id', 'name'],
            where: { isBlocked: false,isDeleted: false },
        });
        res.json({ success: true, data: members });
    } catch (error) {
        console.error('Server error fetching members:', error);
        res.status(500).json({ success: false, message: 'Server error fetching members.' });
    }
});


router.get('/achievements', authenticateToken, async (req, res) => {
    if (!isAdmin(req)) return res.status(403).json({ success: false, message: 'Forbidden' });

    const { year, month } = req.query;
    if (!year || !month) {
        return res.status(400).json({ success: false, message: 'Year and month query parameters are required.' });
    }

    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 1));

    try {
        
        const members = await Member.findAll({
            where: { isBlocked: false },
            attributes: ['id', 'name'],
            include: [{ model: SalesTarget, where: { year, month }, required: false }]
        });

      
        const paidInvoicesInMonth = await Invoice.findAll({
            where: {
                status: 'Paid',
                paidAt: { [Op.between]: [startDate, endDate] }
            },
            include: [{
                model: Quote,
                required: false, 
                include: [{
                    model: Lead,
                    required: false,
                    include: [{ model: ShareGp, as: 'ShareGps', required: false }]
                }]
            }]
        });

       
        const memberSales = new Map();

       
        for (const invoice of paidInvoicesInMonth) {
           
            const salespersonId = invoice.salesmanId;
            if (!salespersonId) continue; 

            
            const invoiceTotal = parseFloat(invoice.grandTotal) || 0;
            const invoiceTotalAED = convertToAED(invoiceTotal, invoice.currency);

          
            if (!memberSales.has(salespersonId)) {
                memberSales.set(salespersonId, { directSalesAED: 0, sharedSalesAED: 0 });
            }

           
            const quote = invoice.Quote;
            const shareInfo = quote?.Lead?.ShareGps?.[0];

         
            if (shareInfo && shareInfo.profitPercentage > 0 && shareInfo.sharedMemberId) {
               
                const sharedMemberId = shareInfo.sharedMemberId;
                
                
                if (!memberSales.has(sharedMemberId)) {
                    memberSales.set(sharedMemberId, { directSalesAED: 0, sharedSalesAED: 0 });
                }

            
                const sharedPercentage = parseFloat(shareInfo.profitPercentage);
                const sharedValue = invoiceTotalAED * (sharedPercentage / 100);
                const ownerValue = invoiceTotalAED - sharedValue;

              
                const ownerRecord = memberSales.get(salespersonId);
                ownerRecord.directSalesAED += ownerValue;

              
                const sharedMemberRecord = memberSales.get(sharedMemberId);
                sharedMemberRecord.sharedSalesAED += sharedValue;

            } else {
               
                const ownerRecord = memberSales.get(salespersonId);
                ownerRecord.directSalesAED += invoiceTotalAED;
            }
        }

   
        const achievementPromises = members.map(async (member) => {
            const sales = memberSales.get(member.id) || { directSalesAED: 0, sharedSalesAED: 0 };
            
         
            const leadCount = await Lead.count({
                where: { salesmanId: member.id, createdAt: { [Op.between]: [startDate, endDate] } }
            });

            const target = member.SalesTargets?.[0];
            let achievedValue = 0;
            if (target) {
                switch (target.targetType) {
                    case 'INVOICE_VALUE':
                        achievedValue = sales.directSalesAED + sales.sharedSalesAED;
                        break;
                    case 'LEADS':
                        achievedValue = leadCount;
                        break;
                }
            }

        
            return {
                memberId: member.id,
                memberName: member.name,
                targetType: target ? target.targetType : 'N/A',
                targetValue: target ? parseFloat(target.targetValue) : 0,
                targetCurrency: target ? target.currency : 'AED',
                achievedValue: parseFloat(achievedValue.toFixed(2)),
                achievementDetails: {
                    directSalesAED: parseFloat(sales.directSalesAED.toFixed(2)),
                    sharedSalesAED: parseFloat(sales.sharedSalesAED.toFixed(2)),
                    totalSalesAED: parseFloat((sales.directSalesAED + sales.sharedSalesAED).toFixed(2)),
                    leadCount: leadCount
                }
            };
        });

        const results = await Promise.all(achievementPromises);
        res.json({ success: true, data: results });

    } catch (error) {
        console.error('Error fetching achievements:', error);
        res.status(500).json({ success: false, message: 'Server error fetching achievements.' });
    }
});


router.post('/', authenticateToken, async (req, res) => {
    if (!isAdmin(req)) return res.status(403).json({ success: false, message: 'Forbidden' });

    const { memberId, targetValue } = req.body;
    const year = new Date().getFullYear();
    const month = new Date().getMonth() + 1;

    if (!memberId || targetValue === undefined) {
        return res.status(400).json({ success: false, message: 'Member ID and Target Value are required.' });
    }

    try {
        const [target, created] = await SalesTarget.findOrCreate({
            where: { memberId, year, month },
            defaults: {
                targetAmount: parseFloat(targetValue),
            }
        });

        if (!created) {
            target.targetAmount = parseFloat(targetValue);
            await target.save();
        }
        res.json({ success: true, message: `Target successfully ${created ? 'set' : 'updated'}.` });
    } catch (error) {
        console.error('Failed to set sales target:', error);
        res.status(500).json({ success: false, message: 'Failed to set sales target.' });
    }
});




router.post('/bulk', authenticateToken, async (req, res) => {
    if (!isAdmin(req)) return res.status(403).json({ success: false, message: 'Forbidden' });

    const { targetValue } = req.body;
    const year = new Date().getFullYear();
    const month = new Date().getMonth() + 1;

    if (targetValue === undefined) {
        return res.status(400).json({ success: false, message: 'Target Value is required.' });
    }

    try {
        const members = await Member.findAll({ where: { isBlocked: false } });
        const promises = members.map(async (member) => {
            const [target, created] = await SalesTarget.findOrCreate({
                where: { memberId: member.id, year, month },
                defaults: {
                    targetAmount: parseFloat(targetValue),
                }
            });

            if (!created) {
                target.targetAmount = parseFloat(targetValue);
                await target.save();
            }
        });

        await Promise.all(promises);

        res.json({ success: true, message: `Targets successfully set/updated for all ${members.length} members.` });
    } catch (error) {
        console.error('Failed to set bulk sales targets:', error);
        res.status(500).json({ success: false, message: 'Failed to set bulk sales targets.' });
    }
});

module.exports = router;