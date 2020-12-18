var chats=[];
var typing=false;
var socket = io();
let MAINS;
// ws = new WebSocket("ws://127.0.0.1:8181")
var uID;

if('serviceWorker' in navigator){
    window.addEventListener('load', ()=>{
        navigator.serviceWorker.register("/hitmee-sw.js").then(function(reg) {
            console.log("Service worker is working fine");
            
            function updateReady(worker) {
                var answerToUpdate = confirm("An update to the page is available, do you wish to receive updates now?");
                
                if(answerToUpdate != true) return;
                worker.postMessage({action : 'skipWaiting'});
            }
        
            if(!navigator.serviceWorker.controller) return;
        
            if(reg.waiting){
                updateReady(reg.waiting);
                return;
            }else if(reg.installing){
                reg.installing.addEventListener("statechange", function(){
                    if (this.state == "installed"){
                        updateReady(reg.installing);
                    }
                });
                return;
            }else{
                reg.addEventListener("updatefound", function(){
                    updateReady(reg.installing);
                    reg.installing.addEventListener("statechange", function(){
                        if (this.state == "installed"){
                            return;
                        }
                    });
                });
            }
            
            navigator.serviceWorker.addEventListener('controllerchange', function(event) {
                window.location.reload();
            });
        
        }).catch(function(err) {
            console.log(err.message);
            console.log("Service worker is not supported");
        });
    }); 
}

socket.emit('update socketID', getCookie("hitmee-username").value);

socket.on('reconnect', function() {
    if(getCookie("hitmee-username")){
        socket.emit('update socketID', getCookie("hitmee-username").value);
        if(getCookie("chattingWith")){
            socket.emit('get presence', getCookie("chattingWith").value);
        }
    }
});

socket.on('connectedTo', function(data) {
    document.cookie = `chattingWith=${data};`;
});

// In-app functions
function navigatePage(page, sessId, buddyName){
    
    sessId = sessId || 'null user';
    buddyName = buddyName || 'null';
    
    switch (page) {
        case 'chats':
            window.location = "/home";
            break;
        
        case 'chatroom':
            window.location = `/chat?sessionID=${sessId}&chattingWith=${buddyName}`;
            break;

        case 'settings':
            window.location = "/settings";
            break;

        case 'friend':
            window.location = "hitmee_friendSearch.html";
            break;

        case 'logout':
            window.location = "/logout";
            break;

        default:
            break;
    }
    
}

function formatTime(hours, minutes) {
    var ampm = (hours >= 12)? 'PM' : 'AM';
    var fhours = (hours>12)? hours - 12 : hours;
    var fmin = (JSON.stringify(minutes).length === 1)? `0${minutes}` : minutes;
    var ftime = fhours+':'+fmin+' '+ampm;
    return ftime;
}

function changeStatus(type){
    var status = '';
    switch(true){
        case (type === 'hover'):
            status = "tap for more details";
            break;

        case (type === 'typing'):
            status = "<i>typing...</i>";
            break;

        case (type === 'idle'):
        	socket.emit("get presence", getCookie("chattingWith").value)
            break;

        default:
            status="online";
    }
    stat1 = get('status1');
    stat1.innerHTML=status;
}

function getCookie(name){
    let arrayCookie = (document.cookie).split(';');
    for (let index = 0; index < arrayCookie.length; index++) {
        if (arrayCookie[index].indexOf(name)!=-1) {
            return {name : decodeURI(arrayCookie[index].split('=')[0]), value : decodeURI(arrayCookie[index].split('=')[1])};
        }
    }
}

function setCookie(name, value){
    document.cookie = `${document.cookie}${name}=${value};`;
}

function getStoredData(key){
    if ('sessionStorage' in window) return sessionStorage.getItem(key);
    else return getCookie(key).value;
}

function addStoredData(key, value) {
    if ('sessionStorage' in window) sessionStorage.setItem(key, value);
    else setCookie(key, value);
}

function formatName(str){
    let formattedString = (str.charAt(0)).toUpperCase()+(str.substring(1)).toLowerCase();
    return formattedString;
}

function notify(id, message, ...components){
	try {
		if (get(id)) get(id).parentNode.removeChild(get(id));

		var text = createComponent("span", message);
		var div = create("div");
		var yPos = 6;

		div.id = id;
		div.style.top = ""+yPos+"%";
		div.classList.add("custom-notify");

		div.appendChild(text);
		
		if(components){
			for (let component of components){
				div.appendChild(component);
			}
		}
		
		if (MAINS) {
			MAINS.appendChild(div);
			var notify_timer = setTimeout(()=>{
				let n_id = id;
				get(n_id).parentNode.removeChild(get(n_id));
				clearTimeout(notify_timer);
			}, 15000);
		}
	} catch (error) {
		console.log(error);
	}
}


// Custom helper functions 
function min(value1, value2) {
    return (value1 > value2)? value2 : value1;
}

function genHex(length){
    length = length || 16;
    let counter = 0;
    let generatedHex = "H";
    let characters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
    
    while(counter <= length){
        let rand_index = Math.round((Math.random()*characters.length)+1);
        generatedHex += characters.charAt(rand_index);
        counter += 1;
    }
    console.log(generatedHex);
    return generatedHex;
}

function getQuery() {
    const object = {};
    const query_list = window.location.search.substring(1).split('&');

    for (let index = 0; index < query_list.length; index++){
        object[query_list[index].split('=')[0]] = query_list[index].split('=')[1];
    }
    
    return object;
}

function get(selector) {
    
    if(typeof selector === "string"){
        if(selector.startsWith("*")){
            selector = selector.replace("*", '');
            return document.querySelectorAll(selector);
        }else{
            return document.getElementById(selector);
        }
    }

    return null;
}

function forEach(elements, reaction){
    for(let i = 0; i < elements.length; i++){
        (reaction)(elements[i]);
    }
}


function create(element) {
    return document.createElement(element);
}

function createText(text) {
    return document.createTextNode(text);
}

function createComponent(type, value, classList) {
    value = value || null;
    classList = classList || null;

    const component = document.createElement(type);
    if (value){
        text = document.createTextNode(value);
        component.appendChild(text);
    }

    if(classList){
        classList.forEach(className => {
            component.classList.add(className);
        });
    }
    return component;
}

function joinComponent(container, ...components) {
    for (let component of components){
        container.appendChild(component);
    }
    return container;
}

function log(output) {
    return console.log(output);
}

document.addEventListener("DOMContentLoaded", ()=>{
	MAINS = get('chat-area1');
});

//  My worker and other tutorials
// const myWorker = new Worker("js/workers/messageWorker.js");
// // myWorker.terminate();

// myWorker.onerror = (error) => {
//     console.log(error);
// };

// myWorker.onmessage = (messageEvent) => {
//     console.log(messageEvent.data);
// };

// myWorker.postMessage({message: "hey"});

localStorage.setItem("temi", "new input");
sessionStorage.setItem("time", "Session");
// window.fetch("/images/avatar.png").then(response=>{

// });

window.addEventListener("storage", function(result) {
    
});



const generateRandomColor = function () {
    
    let red = (Math.random() * 200) + 1;
    let blue = (Math.random() * 200) + 1;
    let green = (Math.random() * 200) + 1;

    let color = `rgb(${red}, ${green}, ${blue})`;
    return color;
};

const formatAsMoney = price => {
    const countries = [
        {
            code: "US",
            currency: "USD",
            country: 'United States'
        },
        {
            code: "NG",
            currency: "NGN",
            country: 'Nigeria'
        },
        {
            code: 'KE',
            currency: 'KES',
            country: 'Kenya'
        },
        {
            code: 'UG',
            currency: 'UGX',
            country: 'Uganda'
        },
        {
            code: 'RW',
            currency: 'RWF',
            country: 'Rwanda'
        },
        {
            code: 'TZ',
            currency: 'TZS',
            country: 'Tanzania'
        },
        {
            code: 'ZA',
            currency: 'ZAR',
            country: 'South Africa'
        },
        {
            code: 'CM',
            currency: 'XAF',
            country: 'Cameroon'
        },
        {
            code: 'GH',
            currency: 'GHS',
            country: 'Ghana'
        }
    ];

    let formattedPrice = price.toLocaleString(undefined, {
        style: "currency",
        currency: "NGN"
    });

    return formattedPrice;
};