
{
    function calculateTotalFromRange(start: number, end: number): number {
        let total: number = 0;
        let i: number = start;

        while (i < end) {
            total = total + i;
            i = i + 1;
        }

        return total;
    }

    calculateTotalFromRange(1, 100);
    calculateTotalFromRange(50, 100);
}
