
{
    function calculateTotalFromRange(start: number, end: number): number {
        console_log("calculateTotalFromRange");

        let total: number = 0;

        for (let i = start; i < end; i++) {
            total = total + i;
        }

        return total;
    }

    function simpleBreak(): number {
        console_log("simpleBreak");

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
        console_log("simpleContinue");

        let total: number = 0;

        for (let i = 0; i < 100; i++) {
            if (i > 50) {
                continue;
            }

            total = total + i;
        }

        return total;
    }

    console_log(calculateTotalFromRange(1, 100));
    console_log(calculateTotalFromRange(50, 100));
    console_log(simpleBreak());
    console_log(simpleContinue());
}
