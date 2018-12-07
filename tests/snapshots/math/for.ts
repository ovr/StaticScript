
{
    function calculateTotalFromRange(start: number, end: number): number {
        let total: number = 0;

        for (let i = start; i < end; i++) {
            total = total + i;
        }

        return total;
    }

    function simpleBreak(): number {
        let total: number = 0;

        for (let i = 0; ; i++) {
            total = total + i;

            if (i > 100) {
                break;
            }
        }

        return total;
    }

    function simpleContinue(): number {
        let total: number = 0;

        for (let i = 0; i++; i++) {
            if (i > 50) {
                continue;
            }

            total = total + i;
        }

        return total;
    }

    calculateTotalFromRange(1, 100);
    calculateTotalFromRange(50, 100);
    simpleBreak();
    simpleContinue();
}
