export function arrayMove<T>(array: T[], from: number, to: number): T[] {
    const next = [...array];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    return next;
}

export function arraySwap<T>(
    array: T[],
    firstIndex: number,
    secondIndex: number,
): T[] {
    if (firstIndex === secondIndex) {
        return [...array];
    }
    if (
        firstIndex < 0 ||
        secondIndex < 0 ||
        firstIndex >= array.length ||
        secondIndex >= array.length
    ) {
        return [...array];
    }

    const next = [...array];
    [next[firstIndex], next[secondIndex]] = [
        next[secondIndex],
        next[firstIndex],
    ];
    return next;
}
