
{
    function compareWithReturnInTrue(left: number, right: number): string {
        console_log("compareWithReturnInTrue");
        console_log(left);
        console_log(right);

        if (left == right) {
            return "true";
        } else {

        }

        return "false";
    }

    compareWithReturnInTrue(1, 5);
    compareWithReturnInTrue(5, 1);

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

    function compareWithReturnInBothBranches(left: number, right: number): string {
        console_log("compareWithReturnInBothBranches");
        console_log(left);
        console_log(right);

        if (left == right) {
            return "true";
        } else {
            return "false";
        }
    }

    compareWithReturnInBothBranches(1, 5);
    compareWithReturnInBothBranches(5, 1);
}
