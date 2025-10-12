import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import MemberTargetGauge from './MemberTargetGauge';

export interface MemberTargetAchievementWithId {
  id: string;
  name: string;
  achieved: number;
  target: number;
  isAchieved: boolean;
}

interface TargetAchievementSliderProps {
  data: MemberTargetAchievementWithId[];
  onEdit: (member: MemberTargetAchievementWithId) => void;
  isLoading?: boolean;
}

const TargetAchievementSlider: React.FC<TargetAchievementSliderProps> = ({ data, onEdit, isLoading }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const itemsInRow = 3;

  const isSliderActive = data.length > itemsInRow;

  useEffect(() => {
    if (!isSliderActive) return;

    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + itemsInRow) % data.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [data.length, isSliderActive]);

  const handlePrev = () => {
    setCurrentIndex(prev => (prev - itemsInRow + data.length) % data.length);
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev + itemsInRow) % data.length);
  };

  if (isLoading) {
    return (
      <div className="bg-gray-100/30 backdrop-blur-md border border-gray-300/70 rounded-2xl shadow-lg py-10 flex justify-center items-center min-h-[400px]">
        <h3 className="text-xl font-bold text-gray-700 animate-pulse">Loading Member Data...</h3>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-gray-100/30 backdrop-blur-md border border-gray-300/70 py-10 rounded-2xl shadow-lg text-center min-h-[400px]">
        <h3 className="text-2xl font-bold text-gray-800 mb-4">Member Target Achievement</h3>
        <div className="text-gray-500 py-10">No member data found. You can add members or seed the database.</div>
      </div>
    );
  }


  const visibleData = useMemo(() => {
    if (!isSliderActive) return data;
    const subset: MemberTargetAchievementWithId[] = [];
    for (let i = 0; i < itemsInRow; i++) {
      const index = (currentIndex + i) % data.length;
      subset.push(data[index]);
    }
    return subset;
  }, [currentIndex, data, isSliderActive, itemsInRow]);

  
  if (!isSliderActive) {
    return (
      <div className="bg-gray-100/30 backdrop-blur-md border border-gray-300/70 py-10 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 min-h-[400px]">
        <h3 className="text-3xl font-bold text-center text-gray-800 tracking-tight mb-6">
          Member Target Achievement
        </h3>
        <div className="flex justify-center gap-6 flex-wrap">
          {data.map(member => (
            <div key={member.id} onClick={() => onEdit(member)} className="cursor-pointer">
              <MemberTargetGauge {...member} />
            </div>
          ))}
        </div>
      </div>
    );
  }


  return (
    <div className="bg-gray-100/30 backdrop-blur-md border border-gray-300/70 py-10 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 min-h-[400px] relative">
      <h3 className="text-3xl font-bold text-center text-gray-800 tracking-tight mb-6">
        Member Target Achievement
      </h3>
      <div className="flex justify-center gap-6 max-w-[900px] mx-auto">
        {visibleData.map(member => (
          <div key={member.id} onClick={() => onEdit(member)} className="cursor-pointer">
            <MemberTargetGauge {...member} />
          </div>
        ))}
      </div>
      <button onClick={handlePrev} className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-2 shadow hover:bg-gray-100 transition">
        <ChevronLeft size={24} className="text-sky-600" />
      </button>
      <button onClick={handleNext} className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-2 shadow hover:bg-gray-100 transition">
        <ChevronRight size={24} className="text-sky-600" />
      </button>
    </div>
  );
};

export default TargetAchievementSlider;
