
{
    function factorial(n: number): number {
        if (n > 1) {
            return n * factorial(n - 1);
        }

        return 1;
    }

    console_log(factorial(10));
}
