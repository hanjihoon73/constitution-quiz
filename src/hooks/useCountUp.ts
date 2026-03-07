import { useState, useEffect, useRef } from 'react';

interface UseCountUpOptions {
    start?: number;
    end: number;
    duration?: number; // ms
    delay?: number; // ms
    useEasing?: boolean;
}

/**
 * requestAnimationFrame 기반의 카운트업(다운) 애니메이션 훅
 */
export function useCountUp({
    start,
    end,
    duration = 1000,
    delay = 0,
    useEasing = true,
}: UseCountUpOptions) {
    const [count, setCount] = useState(start ?? 0);
    const countRef = useRef(start ?? 0);
    const prevEndRef = useRef(start ?? 0);
    const prevStartRef = useRef(start);

    useEffect(() => {
        // end와 start가 모두 이전과 같다면 진행하지 않음
        if (prevEndRef.current === end && prevStartRef.current === start) {
            return;
        }

        let currentStart = countRef.current;
        if (start !== undefined && start !== prevStartRef.current) {
            currentStart = start;
        }

        prevStartRef.current = start;
        prevEndRef.current = end;

        let startTime: number | null = null;
        let animationFrameId: number;
        let timeoutId: NodeJS.Timeout;

        // easeOutQuart
        const easeOut = (t: number) => 1 - Math.pow(1 - t, 4);

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;

            // 경과 비율 (0 ~ 1)
            let percentage = Math.min(progress / duration, 1);

            if (useEasing) {
                percentage = easeOut(percentage);
            }

            const newCount = currentStart + (end - currentStart) * percentage;
            const newCountRounded = Math.round(newCount);
            setCount(newCountRounded);
            countRef.current = newCountRounded; // 값 추적

            if (progress < duration) {
                animationFrameId = requestAnimationFrame(animate);
            } else {
                setCount(end);
                countRef.current = end;
            }
        };

        const startAnimation = () => {
            animationFrameId = requestAnimationFrame(animate);
        };

        if (delay > 0) {
            timeoutId = setTimeout(startAnimation, delay);
        } else {
            startAnimation();
        }

        return () => {
            if (timeoutId) clearTimeout(timeoutId);
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
        };
    }, [end, duration, delay, useEasing, start]);

    return count;
}
