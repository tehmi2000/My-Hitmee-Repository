// Custom helper functions 

/**
 * 
 * @param {integer} value1 
 * @param {integer} value2 
 * @returns {boolean} A value that describes blah kdkkkd
 */
function min(value1, value2) {
    return (value1 > value2)? value2 : value1;
}

function genHex(length){
    length = length || 16;
    let counter = 0;
    let generated_hex = "";
    let characters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
    while(counter <= length){
        let rand_index = Math.round((Math.random()*characters.length)+1);
        generated_hex += characters.charAt(rand_index);
        counter += 1;
    }

    console.log(generated_hex);
    return generated_hex;
}

function get(id) {
    return document.getElementById(id);
}

function create(element) {
    return document.createElement(element);
}

function createText(text) {
    return document.createTextNode(text);
}

function createComponent(type, value) {
    value = value || null;
    var component = document.createElement(type);
    if (value){
        text = document.createTextNode(value);
        component.appendChild(text);
    }    
    return component;
}

function joinComponent(container, ...components) {
    for (let component of components){
        container.appendChild(component);
    }
    return container;
}