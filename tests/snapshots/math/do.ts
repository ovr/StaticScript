
{
    function calculateTotalFromRange(start: number, end: number): number {
        let total: number = 0;
        let i: number = start;

        do {
            total = total + i;
            i += 1;
        } while (i < end);

        return total;
    }

    function simpleBreak(): number {
        let total: number = 0;
        let i: number = 0;

        do {
            total = total + i;
            i += 1;

            if (i > 100) {
                break;
            }
        } while (true);

        return total;
    }

    calculateTotalFromRange(1, 100);
    calculateTotalFromRange(50, 100);
    simpleBreak();
}
