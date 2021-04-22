//requirests to be loaded afte jquery

let myStorage = window.localStorage;
let csrftoken = null;
let myUsername; //picked from credentials
let myId; //picked from credentials
let myToken; //picked from credentials
let myAlias; //picked from credentials
let myTrackers = [];
let myEntities = [];
let myuserlist={};//all users who are send me data
var enabledUsers =[] ;//list of users i want to monitor ( filter option )
let myHostname = window.location.hostname;
let port= window.location.port

let env="dev"
let base_url= `https://${myHostname}:${port}/${env}/`;
let wss_url= `wss://${myHostname}:${port}/ws${env}`;

let updateFrequency= 10; //in seconds we update every x miliseconds
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
	location.href="/home";
}
//clear store my trackers into browser storage
function storeTrackers(trackers){
	obj=retrieveCred();
	obj.Trackers=trackers;
	storeCred(obj);
}
//dummy function not used now take care by myuserlist and enabledusers
function storeEntities(entities){
	obj=retrieveCred();
	obj.Entities=entities;
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
		// updateEntities(myEntities);
		$(`#usersDropdownMenuLink`).html(`+91-${myId}`);
		$(`#changeAlias label`).html(`Current Alias: ${obj.alias}`);
		$(`#changeFrequency label`).html(`Current Frequency: ${updateFrequency} seconds`);
		$(`#myToggler`).removeClass("hide");
		// get my location and plot;
  		getLocation(); 
	} else {
		toggleModal(`userLoginModal`);
	}
}


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
		for (const [key, value] of Object.entries(myuserlist)){
			if (value == "on"){
				$(`#filterUsers`).append(`<input id="${key}" name="${key}" type="checkbox" checked><p>${key}</p>`)
			} else {
				$(`#filterUsers`).append(`<input id="${key}" name="${key}" type="checkbox"><p>${key}</p>`)
			}
		}

	} else if (id == "addTrackerModal"){
		getServices();
	} else if ( id == "userRegisterModal"){
		toggleModal('userLoginModal');
	} else if ( id == "forgotPasswordModal"){
		toggleModal('userLoginModal');
	}
	//clear all feedback messages
	$(`.modal-footer div`).html("");
}

//toggle menu on mobile 
//opens up the tracket user and logout menus in smaller screen
function toggleMenu(){
	$menu = $(`#myToggler .navbar-nav`);
	$menu.toggleClass('showmenu');
}





//switch traking on and off
function trackingSwitch() {
	if (document.getElementById(`trackSwitch`).checked){
		$(`.switch .slider`).html("ON");
		$(`.switch .slider`).css("text-align","left");
		watchid=setInterval(()=>{ getData()},updateFrequency * 1000);
	} else {
		$(`.switch .slider`).html("OFF");
		$(`.switch .slider`).css("text-align","right");
		stopLocation();
	};
}



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
				console.log(data)
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
					$(`#registerfeedback`).html(apifeedback.data.message);
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
	enabledUsers = Object.keys(jsonData);
	// loop through the userlist and remove markers for users 
	// who are not there in enabled users list
	for (const [key, value] of Object.entries(myuserlist)){
		if (enabledUsers.indexOf(key) == -1){
			//users who are not enabled have a state off in myuserlist 
			// and remove their markers
			removeUserMarkers(key);
			myuserlist[key]="off";
		} 
  	}
	toggleLoading();
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
	watchid=setInterval(()=>{ getData()},updateFrequency * 1000);
	toggleLoading();
}


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
						plotPosition(user);
					}
				}
		});
		});

}


//get all the trackers to populate the add tracker drop down
function getServices(){
	fetch(`${base_url}services`,{
			method: 'GET',
			headers: {
	      		'Content-Type': 'application/json',
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
	navigator.geolocation.clearWatch(watchid);
	clearInterval(watchid);
	document.getElementById(`trackSwitch`).checked=false;
}
