'use client';

import Image from 'next/image';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface WelcomeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function WelcomeDialog({ open, onOpenChange }: WelcomeDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent showCloseButton={false} className="max-w-[380px] sm:max-w-[380px] w-[calc(100%-40px)] px-6 py-10 rounded-2xl gap-6">
                <DialogHeader className="pt-2">
                    {/* SR Only Title for accessibility */}
                    <DialogTitle className="sr-only">환영합니다</DialogTitle>
                    <div className="flex justify-center mb-6">
                        <Image
                            src="/bi-constitution-quiz-horizontal.svg"
                            alt="모두의 헌법"
                            width={160}
                            height={40}
                            priority
                        />
                    </div>
                    <div className="text-center space-y-4">
                        <p className="text-[15px] font-medium leading-relaxed text-foreground/90">
                            법은 어렵다고,
                            <br />
                            나와는 먼 이야기라고 생각하시나요?
                        </p>
                        <p className="text-[15px] font-medium leading-relaxed text-foreground/90">
                            하지만 <span className="font-bold text-foreground">헌법</span>은 대한민국 국민이라면
                            <br />
                            꼭 알아야 할 <span className="font-bold text-foreground">우리 모두의 법</span>입니다.
                        </p>
                        <p className="text-[15px] font-medium leading-relaxed text-foreground/90">
                            모르면 당할 수 있지만,
                            <br />
                            알면 방패가 되는 헌법.
                        </p>
                        <p className="text-[15px] font-bold text-foreground">
                            모두의 헌법에서 만나보세요.
                        </p>
                    </div>
                </DialogHeader>

                <DialogFooter className="sm:justify-center pt-2">
                    <Button
                        type="button"
                        className="w-full h-12 rounded-xl font-semibold bg-[#2D2D2D] text-[#FF8400] border-none shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 focus-visible:ring-0 focus-visible:ring-offset-0 cursor-pointer"
                        onClick={() => onOpenChange(false)}
                    >
                        확인
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
