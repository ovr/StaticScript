
{
    function doMath(): number {
        const a = 5.5;
        const b = 14.5;

        return ((a + b) * 50) / 10;
    }

    const a: int8 = 10;
    const b: int16 = 10;
    const c: int32 = 10;
    const d: int64 = 10;
    const e: int128 = 10;

    console_log("hello");
    console_log(doMath());
    console_log(true);
    console_log(false);
    console_log(1 > 5);
    console_log(1 < 5);
}
