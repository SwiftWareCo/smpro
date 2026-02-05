interface Step {
    title: string;
    content: string;
}

interface StepGuideProps {
    steps: Step[];
}

export function StepGuide({ steps }: StepGuideProps) {
    return (
        <div className="space-y-6 my-8">
            {steps.map((step, index) => (
                <div key={index} className="flex gap-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold shrink-0">
                        {index + 1}
                    </div>
                    <div className="flex-1 pt-1">
                        <h4 className="font-semibold text-lg">{step.title}</h4>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">{step.content}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}
