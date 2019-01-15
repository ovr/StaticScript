
{
    function compareWithReturnInElse(left: number, right: number): string {
        console_log("compareWithReturnInElse");
        console_log(left);
        console_log(right);

        if (left == right) {

        } else {
            return "false";
        }

        return "true";
    }

    compareWithReturnInElse(1, 5);
    compareWithReturnInElse(5, 1);
}
