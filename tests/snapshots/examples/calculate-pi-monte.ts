
{
    // Monte Carlo simulation
    function calculatePI(cycles: number): number {
        let inside = 0;

        for (let i = 0; i < cycles; i++) {
            let x = Math.random() * 2 - 1;
            let y = Math.random() * 2 - 1;

            if ((x*x + y*y) < 1) {
                inside++
            }
        }

        return 4.0 * inside / cycles;
    }

    console_log("Monte Carlo simulation");
    console_log(calculatePI(10000000));
}
