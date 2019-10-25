function init_settings(){
    // get("username").innerHTML='<br/><div>Your username is:</div><h4>'+(get_cookie("hitmee-username").value).toUpperCase()+'</h4>';
    
    let unlock = get("enable_edit");
    unlock.addEventListener('click', function(evt){
    	evt.preventDefault();
    	get("profile-box").scrollTop = "555";
    	try{
    		get("bio").removeAttribute('disabled');
    		get("phone_no").removeAttribute('disabled');
    		get("email").removeAttribute('disabled');
    		get("tel_code").removeAttribute('disabled');
    	}catch(e){}
    });
    
    let dp_button = get("p_upload");
    dp_button.addEventListener('change', previewDPImage);
    
    dp_button.addEventListener('change', function(evt){
    	get("dp_status").style.display = "block";
    	get("dp_status").innerHTML = "DP selected";
    });

    let destroy_button = get("account_destroy_button");
    destroy_button.addEventListener('click', function(evt){
        socket.emit('destroy account', get_cookie("hitmee-username").value);
    });
}

function previewDPImage(event){
	
	var reader = new FileReader();
    reader.readAsDataURL(event.target.files[0]);
    reader.onload = function(){
      var output = get('preview-picture'); 
       output.src = reader.result;
       alert("imageresult received");
    };
    
}

function check(){

    // phone_string = get("phone_no").value;

    // for(let index=0; index < phone_string.length; index++){
    //     alert(parseInt(phone_string.charAt(index)));
    //     if (parseInt(phone_string.charAt(index))===NaN) {
    //         alert(`Found Invalid Number at position ${index}`);
    //         return false;
    //     }
    // }
    // return false;
    let tel_code = get("tel_code").value;
    let phone = parseInt(get("phone_no").value);
    if (phone.toString().length == 10){
        // get("phone_no").value = phone;
        return true;
    }else{
        alert('Invalid Number');
        return false;
    }

}

function changeFilename() {
    var dpInput = get("p_upload").value;
    var wpInput = get("wp_upload").value;
    try{
        if (dpInput.lastIndexOf('/')!=-1){
            dpname = dpInput.substring(lastIndexOf('/'));
        }else if(dpInput.lastIndexOf('\\')!=-1){
            dpname = dpInput.substring(lastIndexOf('\\'));
        }
    }catch(err){
        console.log(err);
    }


    console.log("Dpinput:", dpname);
    console.log("Wpinput:", wpInput);
    return false;
}

socket.emit('get_details', get_cookie("hitmee-username").value);

socket.on('receive_details', function(data) {

	let phone = (data.phone!='')? data.phone : '+123-000-000-0000';
    get("bio_display").innerHTML="<i>"+data.bio+"</i>";
    get("email_display").innerHTML=data.email;
    get("phone_display").innerHTML=phone;
    get("phone_display").href="tel:"+phone;
    get("email_display").href="mailTo:"+data.email;
    
    get("preview-wall").src=data.wp;
    get("preview-picture").src=data.pp;
    get("bio").value=data.bio;
    get("phone_no").value = phone;
    get("email").value=data.email;
});