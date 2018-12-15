
{
    function compareNumberLeftLessRight(left: number, right: number): void {
        console_log("compareNumberLeftLessRight");
        console_log(left);
        console_log(right);

        if (left < right) {
            console_log("true");
        } else {
            console_log("false");
        }

        console_log("");
    }

    function compareNumberLeftMoreRight(left: number, right: number): void {
        console_log("compareNumberLeftMoreRight");
        console_log(left);
        console_log(right);

        if (left > right) {
            console_log("true");
        } else {
            console_log("false");
        }

        console_log("");
    }

    compareNumberLeftLessRight(1, 100);
    compareNumberLeftLessRight(101, 100);

    compareNumberLeftMoreRight(101, 100);
    compareNumberLeftMoreRight(1, 100);
}
