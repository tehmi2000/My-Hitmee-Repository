// class Message{
//     function (str) {
//         
//     }
// }
export function Message(str) {
    this._str = str;

    let speak = function() {
        console.log(this._str);
    };
}

// export default function Message(str) {
//     console.log("hell0 "+str);
// }