import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

interface SubscriptionCountdownProps {
  endDateString: string;
  onExpire?: () => void;
}

const padZero = (num: number) => num.toString().padStart(2, '0');

const SubscriptionCountdown: React.FC<SubscriptionCountdownProps> = ({ endDateString, onExpire }) => {
  const { t } = useTranslation();
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
  });
  const [isFreemium, setIsFreemium] = useState(false);
  const hasExpired = useRef(false);
  const previousEndDate = useRef(endDateString);

  useEffect(() => {
    if (previousEndDate.current !== endDateString) {
        hasExpired.current = false;
        previousEndDate.current = endDateString;
    }

    const endDate = new Date(endDateString);
    const isFreemiumUser = endDate.getTime() === 0;

    if (isFreemiumUser) {
        setIsFreemium(true);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
        return;
    }
    setIsFreemium(false);

    const calculate = () => {
        const now = new Date();
        const diff = endDate.getTime() - now.getTime();

        if (diff <= 0) {
            if (!hasExpired.current && onExpire) {
                onExpire();
                hasExpired.current = true;
            }
            setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
            return false; // Stop interval
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds, isExpired: false });
        return true; // Continue interval
    };
    
    if (!calculate()) return;

    const intervalId = setInterval(() => {
        if (!calculate()) {
            clearInterval(intervalId);
        }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [endDateString, onExpire]);

  if (isFreemium) {
    return <span className="font-medium text-green-400">{t('user.status.member')}</span>;
  }

  if (timeLeft.isExpired) {
    return <span className="font-medium text-red-400">{t('countdown.expired')}</span>;
  }

  const timeString = `${padZero(timeLeft.hours)}:${padZero(timeLeft.minutes)}:${padZero(timeLeft.seconds)}`;

  if (timeLeft.days > 0) {
    return <span className="font-medium text-green-400" title={t('countdown.remainingFull', { days: timeLeft.days, time: timeString })}>{t('countdown.days', { count: timeLeft.days })}, {timeString}</span>;
  }
  
  return <span className="font-medium text-yellow-400" title={t('countdown.remainingTime', { time: timeString })}>{timeString}</span>;
};

export default SubscriptionCountdown;