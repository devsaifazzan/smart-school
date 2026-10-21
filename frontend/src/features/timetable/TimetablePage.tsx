import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { Clock, MapPin, User, BookOpen } from 'lucide-react';

export const TimetablePage: React.FC = () => {
  const { t } = useTranslation();
  const [selectedDay, setSelectedDay] = useState<string>('Sunday');

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];

  const { data: timetables, isLoading } = useQuery({
    queryKey: ['timetables', selectedDay],
    queryFn: async () => {
      const res = await apiClient.get('/timetables/', {
        params: { day_of_week: selectedDay },
      });
      return res.data?.results || res.data || [];
    },
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          {t('timetable.title')}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1">
          {t('timetable.subtitle')}
        </p>
      </div>

      {/* Days Filter Buttons - Scrollable on mobile */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
        {days.map((day) => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition shadow-2xs shrink-0 active:scale-95 ${
              selectedDay === day
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
            }`}
          >
            {day}
          </button>
        ))}
      </div>

      {/* Timetable Grid */}
      <div className="space-y-3 sm:space-y-4">
        {isLoading ? (
          <div className="py-16 text-center text-sm text-slate-400">{t('common.loading')}</div>
        ) : timetables?.length === 0 ? (
          <div className="py-12 sm:py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center text-xs sm:text-sm text-slate-400">
            No scheduled classes for {selectedDay}.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {timetables.map((slot: any) => (
              <div
                key={slot.id}
                className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-indigo-300 transition space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold">
                    <Clock className="w-3.5 h-3.5" />
                    {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                  </span>
                  <span className="text-xs font-bold text-slate-500">
                    {slot.class_level_name} • {slot.section_name}
                  </span>
                </div>

                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-indigo-600" />
                    {slot.subject_name}
                  </h3>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    {slot.teacher_name}
                  </span>
                  {slot.classroom && (
                    <span className="flex items-center gap-1 font-medium text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {slot.classroom}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
