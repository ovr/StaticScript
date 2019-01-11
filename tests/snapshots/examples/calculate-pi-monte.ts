
{
    // Monte Carlo simulation
    function calculatePI(cycles: number, r: number): number {
        let inside = 0;

        for (let i = 0; i < cycles; i++) {
            let x = Math.random() * r;
            let y = Math.random() * r;

            if ((x*x + y*y) < r*r) {
                inside++
            }
        }

        return 4.0 * inside / cycles;
    }

    console_log("Monte Carlo simulation");
    console_log(calculatePI(1e8, 2 ** 16));
}
