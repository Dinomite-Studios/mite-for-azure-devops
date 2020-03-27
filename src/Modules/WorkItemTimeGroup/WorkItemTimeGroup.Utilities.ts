export class WorkItemTimeGroupUtilities {

    /**
     * Creates a pretty print string of a passed amount of minutes in the format
     * hh:mm.
     * @param minutes The count of minutes to pretty print.
     */
    public static prettyPrintMinutes(minutes: number): string {
        const hours = Math.floor(minutes / 60);
        const min = minutes - hours * 60;

        return `${this.padWithZero(hours)}:${this.padWithZero(min)}`;
    }

    private static padWithZero(n: number): string {
        if (n <= 9) {
            return `0${n}`
        }

        return `${n}`;
    }
}