Array.prototype.groupBy = function (keySelector) {
    const result = {}
    for (const item of this) {
        const key = item == null ? "null" : keySelector(item);
        if (!result.hasOwnProperty(key)) {
            result[key] = []
        }

        result[key].push(item)
    }

    return result;
}

const number = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
const result = number.groupBy(x => x % 2 === 0 ? "Even" : "Odd");

console.log(result)


