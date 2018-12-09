
{
    // Use the Gregory-Leibniz series.
    function calculatePI(cycles: number): number {
        let pi = 0;
        let i = 1;

        while (i < cycles) {
            pi = pi + (4 / i);
            pi = pi - (4 / (i + 2));

            i = i + 4;
        }

        return pi;
    }

    console_log("Gregory-Leibniz series");
    console_log(calculatePI(500000));
}
