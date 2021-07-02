//requires to be loaded afte jquery
let myStorage = window.localStorage;
let csrftoken = null;
let myUsername; //picked from credentials
let myId; //picked from credentials
let myToken; //picked from credentials
let myAlias; //picked from credentials
let myRole; //Am i tracker
let myTrackers = [];
let myuserlist={};//all users who are send me data
let enabledUsers ={} ;//list of users i want to monitor ( filter option )

let updateFrequency= 60; //in seconds we update every x miliseconds

let myHostname = window.location.hostname;
let port= window.location.port

let env="api"
let base_url= `https://${myHostname}:${port}/${env}/`;
// Websocket no longer used instead we use REDIS search using API call
// reduces number of connections to server and saves money 
// let wss_url= `wss://${myHostname}:${port}/ws${env}`;





//Authentication related Funtions below
//store credentails into browser storage for reuse 
function storeCred(cred){
	obj=cred
	myUsername=obj.email;
	myId=obj.id;
	myToken=obj.token;
	try {
		myStorage.setItem('tracker_ngin',JSON.stringify(obj));
	} catch(err){
		alert("Error storing profile"+err)
	}
}

//retrieve stored credentials from browser storage
function retrieveCred(){
	obj=JSON.parse(myStorage.getItem('tracker_ngin'));
	if (obj){
		return obj;
	}
	else{
		return undefined;
	}
}

//clear stored credentials from browser storage
function clearCred(){
	myStorage.removeItem('tracker_ngin');
	try{
		source.close();
	} catch{}
	location.href="/home";
}

//clear store my trackers into browser storage
function storeTrackers(trackers){
	obj=retrieveCred();
	obj.Trackers=trackers;
	storeCred(obj);
}

//run this when the site opens and take corresponding action
function userAuth(){
	obj=retrieveCred();
	if (obj){
		myUsername=obj.email;
		myId=obj.id;
		myToken=obj.token;
		myTrackers=obj.trackers;
		// myEntities=obj.Entities;
		myAlias=obj.alias;
		updateTrackers(myTrackers);//updates the trackers list 
		myRole=obj.isTracker == "True" ? "tracker" : "trackee"; 
		// updateEntities(myEntities);
		$(`#usersDropdownMenuLink`).html(`+91-${myId}`);
		$(`#changeAlias label`).html(`Current Alias: ${obj.alias}`);
		$(`#changeFrequency label`).html(`Current Frequency: ${updateFrequency} seconds`);
		$(`#myToggler`).removeClass("hide");
		$(`.switch .slider`).html("OFF");
		$(`.switch .slider`).css("text-align","right");
		if (myRole == "tracker"){
			$(`#myToggler .navbar-nav .tracker`).removeClass("hide");
		} else {
			$(`#myToggler .navbar-nav .trackee`).removeClass("hide");
		}
		// get my location and plot;
  		getLocation(); 
	} else {
		toggleModal(`userLoginModal`);
	}
}
//Authentication related functions end here


// UI base Scripts //
//loading modal to impress user :)
function toggleLoading(){
	$body = $("body");
	$body.toggleClass("loading");
}

//modals
function toggleModal(id){
	// Get the modal
	$modal = $(`#${id}`);
	$modal.toggleClass('show');
	//only if user modal is filtermodel then create a list of users with check box
	//users with state value as on are checked and off as not checked
	if ( id == "filterUserModal"){	
		$(`#filterUsers #userHolder`).empty();
		for (const [key, value] of Object.entries(myuserlist)){
			if (value == "on"){
				$(`#filterUsers #userHolder`).append(`<div class="btn-holder"><input id="${key}" name="${key}" type="checkbox" checked>${myUserMapping[key]}</div>`)
			} else {
				$(`#filterUsers #userHolder`).append(`<div class="btn-holder"><input id="${key}" name="${key}" type="checkbox">${myUserMapping[key]}</div>`)
			}
		}

	} 
	// else if (id == "addTrackerModal"){
	// 	getServices();
	// } 
	else if ( id == "userRegisterModal"){
		toggleModal('userLoginModal');
	} else if ( id == "forgotPasswordModal"){
		toggleModal('userLoginModal');
	} else if ( id == "callModal"){
		$(`#callUser #UserList`).empty();
		if (myRole == "tracker"){
			$(`#callUser #UserList`).append(`<option value="general-${myId}">All</option>`)
		}
		for (const [k, v] of Object.entries(myUserMapping)){
				$(`#callUser #UserList`).append(`<option value="${k}">${v}</option>`)
		}
		for ( const tracker of myTrackers){
			$(`#callUser #UserList`).append(`<option value="${tracker}">${tracker}</option>`);
			$(`#callUser #UserList`).append(`<option value="general-${tracker}">All-${tracker}</option>`);
		}
	}
	//clear all feedback messages on modal close
	$(`.modal-footer div`).html("");
}

//toggle menu on mobile 
//opens up the tracket user and logout menus in smaller screen
function toggleMenu(){
	$menu = $(`#myToggler .navbar-nav`);
	$menu.toggleClass('showmenu');
}
// END UI Based Scripts//




//switch traking on and off
function trackingSwitch() {
	if (document.getElementById(`trackSwitch`).checked){
		$(`.switch .slider`).html("ON");
		$(`.switch .slider`).css("text-align","left");

		if ( myRole == "tracker"){
			//Trackers get location
			getLocation(); 
			watchid=setInterval(()=>{ getData()},updateFrequency * 1000);
		} else {
			//Trackees send location
			watchid=setInterval(()=>{ getLocation()},updateFrequency * 1000);
		}
		//common event receiver (message)
		eventId=setInterval(()=> {EventReceiver()}, updateFrequency *1000);
	} else {
		$(`.switch .slider`).html("OFF");
		$(`.switch .slider`).css("text-align","right");
		stopLocation();
	};
}


// MODAL based Submit actions //
// Dont ask why somany fetch , i prefer SOLID principles as much as possible
// having differenct interfaces and SOP , dont touch and screw-up what is working
// login stuff here
const loginForm = document.getElementById('login');
loginForm.addEventListener('submit', userLogin);

function userLogin(event){
	event.preventDefault();
	toggleLoading();
	const data = new FormData(event.target);
	const jsonData = Object.fromEntries(data.entries());

	fetch(`${base_url}users`,{
			method: 'POST',
			headers: {
	      		'Content-Type': 'application/json'
	    		},
	    	body: JSON.stringify(jsonData)
	    	}	
		).then(response => {
			response.json().then(data => {
			if (!response.ok){
					return { data :data, state :false}
				}
			else{
					return { data :data, state :true}
				}
			}).then((apifeedback) => {
				toggleLoading();
				if (apifeedback.state){
					storeCred(apifeedback.data);
					userAuth();
					toggleModal(`userLoginModal`);
					loginForm.reset();	
				} else {
					$(`#loginfeedback`).html(apifeedback.data.message);
				}
		});
		})
}

//Register Stuff
const registerForm = document.getElementById('register');
registerForm.addEventListener('submit', registerLogin);

function registerLogin(event){
	event.preventDefault();
	toggleLoading();
	const data = new FormData(event.target);
	const jsonData = Object.fromEntries(data.entries());

	fetch(`${base_url}users`,{
			method: 'PUT',
			headers: {
	      		'Content-Type': 'application/json'
	    		},
	    	body: JSON.stringify(jsonData)
	    	}
		).then(response => {
			response.json().then(data => {
			if (!response.ok){
					return { data :data, state :false}
				}
			else{
					return { data :data, state :true}
				}
			}).then((apifeedback) => {
				toggleLoading();
				if (apifeedback.state){
					$(`#registerfeedback .b`).html(apifeedback.data.message);
					registerForm.reset();	
				} else {
					$(`#registerfeedback`).html(`${apifeedback.data.message}, ${apifeedback.data.Reason}`);
				}
		});
		})
}


//forgot password Stuff
const forgotPasswordForm = document.getElementById('forgotPassword');
forgotPasswordForm.addEventListener('submit', forgotPassword);

function forgotPassword(event){
	event.preventDefault();
	toggleLoading();
	const data = new FormData(event.target);
	const jsonData = Object.fromEntries(data.entries());

	fetch(`${base_url}forgotpassword`,{
			method: 'POST',
			headers: {
	      		'Content-Type': 'application/json'
	    		},
	    	body: JSON.stringify(jsonData)
	    	}
		).then(response => {
			response.json().then(data => {
			if (!response.ok){
					return { data :data, state :false}
				}
			else{
					return { data :data, state :true}
				}
			}).then((apifeedback) => {
				toggleLoading();
				if (apifeedback.state){
					$(`#forgotpasswordfeedback`).html(apifeedback.data.message);
					registerForm.reset();	
				} else {
					$(`#forgotpasswordfeedback`).html(`${apifeedback.data.message}, ${apifeedback.data.Reason}`);
				}
		});
		})
}


//reset password Stuff
const resetPasswordForm = document.getElementById('resetPassword');
resetPasswordForm.addEventListener('submit', resetPassword);

function resetPassword(event){
	event.preventDefault();
	toggleLoading();
	const data = new FormData(event.target);
	const jsonData = Object.fromEntries(data.entries());

	fetch(`${base_url}resetpassword`,{
			method: 'POST',
			headers: {
	      		'Content-Type': 'application/json',
	      		'id':myId,
	      		'token':myToken
	    		},
	    	body: JSON.stringify(jsonData)
	    	}
		).then(response => {
			response.json().then(data => {
			if (!response.ok){
					return { data :data, state :false}
				}
			else{
					return { data :data, state :true}
				}
			}).then((apifeedback) => {
				toggleLoading();
				if (apifeedback.state){
					$(`#resetPasswordfeedback`).html(apifeedback.data.message);
					registerForm.reset();	
				} else {
					$(`#resetPasswordfeedback`).html(`${apifeedback.data.message}, ${apifeedback.data.Reason}`);
				}
		});
		})
}

//add Tracker Stuff
const addTrackerForm = document.getElementById('addTracker');
addTrackerForm.addEventListener('submit', addTracker);

function addTracker(event){
	event.preventDefault();
	toggleLoading();
	const data = new FormData(event.target);
	const jsonData = Object.fromEntries(data.entries());

	fetch(`${base_url}tracker`,{
			method: 'POST',
			headers: {
	      		'Content-Type': 'application/json',
	      		'id':myId,
	      		'token':myToken
	    		},
	    	body: JSON.stringify(jsonData)
	    	}
		).then(response => {
			response.json().then(data => {
			if (!response.ok){
					return { data :data, state :false}
				}
			else{
					return { data :data, state :true}
				}
			}).then((apifeedback) => {
				toggleLoading();
				if (apifeedback.state){
					$(`#addTrackerfeedback`).html(apifeedback.data.message);
					myTrackers=apifeedback.data.Trackers;
					storeTrackers(myTrackers);
					updateTrackers(myTrackers);
					addTrackerForm.reset();	
				} else {
					$(`#addTrackerfeedback`).html(`${apifeedback.data.message}, ${apifeedback.data.Reason}`);
				}
		});
		})
}

function updateTrackers(trackers){
	$(`#myTrackerList`).empty();
	$(`#delTrackerList`).empty();
	for ( const tracker of trackers){
		$(`#myTrackerList`).append(`<option>${tracker}</option>`);
		$(`#delTrackerList`).append(`<option>${tracker}</option>`);
	}
}

// //delete Tracker Stuff
const deleteTrackerForm = document.getElementById('deleteTracker');
deleteTrackerForm.addEventListener('submit', deleteTracker);

function deleteTracker(event){
	event.preventDefault();
	toggleLoading();
	const data = new FormData(event.target);
	const jsonData = Object.fromEntries(data.entries());

	fetch(`${base_url}tracker`,{
			method: 'DELETE',
			headers: {
	      		'Content-Type': 'application/json',
	      		'id':myId,
	      		'token':myToken
	    		},
	    	body: JSON.stringify(jsonData)
	    	}
		).then(response => {
			response.json().then(data => {
			if (!response.ok){
					return { data :data, state :false}
				}
			else{
					return { data :data, state :true}
				}
			}).then((apifeedback) => {
				toggleLoading();
				if (apifeedback.state){
					$(`#deleteTrackerfeedback`).html(apifeedback.data.message);	
					myTrackers=apifeedback.data.Trackers;
					storeTrackers(myTrackers);
					updateTrackers(myTrackers);
					deleteTrackerForm.reset();	
				} else {
					$(`#deleteTrackerfeedback`).html(`${apifeedback.data.message}, ${apifeedback.data.Reason}`);
				}
		});
		})
}

// //filter user Stuff
const filterUsersForm = document.getElementById('filterUsers');
filterUsersForm.addEventListener('submit', filterUsers);

function filterUsers(event){
	event.preventDefault();
	toggleLoading();
	const data = new FormData(event.target);
	const jsonData = Object.fromEntries(data.entries());
	const filteredUsers = Object.keys(jsonData);
	// loop through the userlist and remove markers for users 
	// who are not there in enabled users list
	for (const [key, value] of Object.entries(myuserlist)){
		if (filteredUsers.indexOf(key) == -1){
			//users who are not enabled have a state off in myuserlist 
			// and remove their markers
			myuserlist[key]="off";
			delete enabledUsers[key];
		} else {
			enabledUsers[key]=myUserMapping[key];
		}
  	}
	toggleLoading();
	$(`#filterfeedback`).html("Filter applied and will take effect in 60 seconds/update frequency")
}


//Invite users
const inviteUserForm = document.getElementById('inviteUser');
inviteUserForm.addEventListener('submit', inviteUser);

function inviteUser(event){
	event.preventDefault();
	toggleLoading();
	const data = new FormData(event.target);
	const jsonData = Object.fromEntries(data.entries());
	jsonData.inviter = myUsername;

	fetch(`${base_url}invite`,{
			method: 'POST',
			headers: {
	      		'Content-Type': 'application/json',
	      		'id':myId,
	      		'token':myToken
	    		},
	    	body: JSON.stringify(jsonData)
	    	}
		).then(response => {
			response.json().then(data => {
			if (!response.ok){
					return { data :data, state :false}
				}
			else{
					return { data :data, state :true}
				}
			}).then((apifeedback) => {
				toggleLoading();
				if (apifeedback.state){
					$(`#invitefeedback`).html(apifeedback.data.message);	
					inviteUserForm.reset();
				} else {
					$(`#invitefeedback`).html(`${apifeedback.data.message}, ${apifeedback.data.Reason}`);
				}
		});
		})
}

//Invite users
const callUserForm = document.getElementById('callUser');
callUserForm.addEventListener('submit', callUser);

function callUser(event){
	event.preventDefault();
	toggleLoading();
	const data = new FormData(event.target);
	const jsonData = Object.fromEntries(data.entries());
	jsonData.inviter = myUsername;

	fetch(`${base_url}publish`,{
			method: 'POST',
			headers: {
	      		'Content-Type': 'application/json',
	      		'id':myId,
	      		'token':myToken
	    		},
	    	body: JSON.stringify(jsonData)
	    	}
		).then(response => {
			response.json().then(data => {
			if (!response.ok){
					return { data :data, state :false}
				}
			else{
					return { data :data, state :true}
				}
			}).then((apifeedback) => {
				toggleLoading();
				if (apifeedback.state){
					$(`#callfeedback`).html(apifeedback.data.message);	
					inviteUserForm.reset();
				} else {
					$(`#callfeedback`).html(`${apifeedback.data.message}, ${apifeedback.data.Reason}`);
				}
		});
		})
}

//change user alias
const changeAliasForm = document.getElementById('changeAlias');
changeAliasForm.addEventListener('submit', changeAlias);

function changeAlias(event){
	event.preventDefault();
	toggleLoading();
	const data = new FormData(event.target);
	const jsonData = Object.fromEntries(data.entries());

	fetch(`${base_url}alias`,{
			method: 'POST',
			headers: {
	      		'Content-Type': 'application/json',
	      		'id':myId,
	      		'token':myToken
	    		},
	    	body: JSON.stringify(jsonData)
	    	}
		).then(response => {
			response.json().then(data => {
			if (!response.ok){
					return { data :data, state :false}
				}
			else{
					return { data :data, state :true}
				}
			}).then((apifeedback) => {
				toggleLoading();
				if (apifeedback.state){
					$(`#changeAliasfeedback`).html(apifeedback.data.message);	
					obj=retrieveCred();
					obj.alias=apifeedback.data.alias;
					storeCred(obj);
					$(`#changeAlias label`).html(`Current Alias: ${obj.alias}`);
					myAlias=obj.alias;
					changeAliasForm.reset();
				} else {
					$(`#changeAliasfeedback`).html(`${apifeedback.data.message}, ${apifeedback.data.Reason}`);
				}
		});
		})
}

//change update frequency
const changeFrequencyForm = document.getElementById('changeFrequency');
changeFrequencyForm.addEventListener('submit', changeFrequency);

function changeFrequency(event){
	event.preventDefault();
	toggleLoading();
	const data = new FormData(event.target);
	const jsonData = Object.fromEntries(data.entries());
	updateFrequency=jsonData.frequency;
	$(`#changeFrequency label`).html(`Current Frequency: ${updateFrequency} seconds`);
	$(`#changeFrequencyfeedback`).html(`Update Frequency Updated, the new frequency will be lost on browser refresh`);
	clearInterval(watchid);
	clearInterval(eventId);
	watchid=setInterval(()=>{ getData()},updateFrequency * 1000);
	eventId=setInterval(()=> {EventReceiver()}, updateFrequency *1000);
	toggleLoading();
}

// function to send location to server for both tracker and trackee
function sendData(jsonData){
	fetch(`${base_url}location`,{
			method: 'POST',
			headers: {
	      		'Content-Type': 'application/json',
	      		'id':myId,
	      		'token':myToken
	    		},
	    	body: JSON.stringify(jsonData)
	    	}
		).then(response => {
			response.json().then(data => {
			if (!response.ok){
					return { data :data, state :false}
				}
			else{
					return { data :data, state :true}
				}
			}).then((apifeedback) => {
				if ( ! apifeedback.state){
					$(`#errorLogs`).html(`${apifeedback.data.message}, ${apifeedback.data.Reason}`);
				} 
		});
		});

}

// function to get location to server for tracker
function getData(){
	fetch(`${base_url}location`,{
			method: 'GET',
			headers: {
	      		'Content-Type': 'application/json',
	      		'id':myId,
	      		'token':myToken
	    		},
	    	}
		).then(response => {
			response.json().then(data => {
			if (!response.ok){
					return { data :data, state :false}
				}
			else{
					return { data :data, state :true}
				}
			}).then((apifeedback) => {
				if ( ! apifeedback.state){
					$(`#errorLogs`).html(`${apifeedback.data.message}, ${apifeedback.data.Reason}`);
				}  else {
					for (const user of apifeedback.data.message){
							plotPosition(user,"trackee");
					}
				}
		});
		});

}


//get all the trackers to populate the add tracker drop down
function getServices(){
	fetch(`${base_url}services/trackee`,{
			method: 'GET',
			headers: {
	      		'Content-Type': 'application/json',
	      		'id':myId,
	      		'token':myToken
	      		},
	    	}
		).then(response => {
			response.json().then(data => {
			if (!response.ok){
					return { data :data, state :false}
				}
			else{
					return { data :data, state :true}
				}
			}).then((apifeedback) => {
				if ( ! apifeedback.state){
					$(`#errorLogs`).html(`${apifeedback.data.message}, ${apifeedback.data.Reason}`);
				}  else {
					$(`#addTrackerList`).empty();
					for (const tracker of apifeedback.data.message){
						$(`#addTrackerList`).append(`<option value="${tracker.phone}">${tracker.alias}:${tracker.phone}</option>`);
					}
				}
		});
		});


}

// stop processing and leave the user alone
function stopLocation(){
	// console.log("closing connection");
	destroy_markers();
	clearInterval(watchid);
	document.getElementById(`trackSwitch`).checked=false;
	source.close();
}

//sse 
let source;
function EventReceiver(){
		fetch(`${base_url}event`,{
			method: 'GET',
			headers: {
	      		'Content-Type': 'application/json',
	      		'id':myId,
	      		'token':myToken
	      		},
	    	}
		).then(response => {
			response.json().then(data => {
			if (!response.ok){
					return { data :data, state :false}
				}
			else{
					return { data :data, state :true}
				}
			}).then((apifeedback) => {
				if ( ! apifeedback.state){
					$(`#errorLogs`).html(`${apifeedback.data.message}, ${apifeedback.data.Reason}`);
				}  else {
					// $(`#addTrackerList`).empty();
					for (const tracker of apifeedback.data.message){
						if (tracker) {
							message=JSON.parse(tracker);
							$(`#messages`).prepend(`<div style="margin: 10px; border: 1px solid black">
													<p>From : ${message.from}</p>
													<p>Message : ${message.message}</p>
													</div>`);
							toggleModal('messageModal');
							message.alias = message.from
							if (message.location) {
								plotPosition(message, "user");
							}
						}
					}

				}
		});
		});

}


//start once every thing is loaded;
$(document).ready(function(){
	// handle the verify email stuff
		let searchParams = new URLSearchParams(location.search);

		if (searchParams.has("action")){
	        let action = searchParams.get("action");
	        if (action == "success"){
	          alert("Success, Now you can login");
	          location.search="";
	        } else {
	          alert("Failure, Some thing went wrong");
	          location.search="";
	        }
	    } else if (searchParams.has("id") && searchParams.has("email"))
	    {
	    	let phone=parseInt(searchParams.get("id"));
	    	let email=searchParams.get("email");
	    	$(`#login input[name=id]`).val(phone);
	    	$(`#login input[name=email]`).val(email);
	    }
	    userAuth();
       		
    // Verify email done
    // Now start the auth process
});
