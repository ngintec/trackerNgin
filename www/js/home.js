let options = {
          enableHighAccuracy: false,
          timeout: 5000,
          maximumAge: 5000
        }; //options for getting locations

//Create a map and load into map container
// will be empty till we get tracking data
map = new OpenLayers.Map("mapContainer");
map.addLayer(new OpenLayers.Layer.OSM());




let zoom=12;//zoom the map doth set too high zoom on screen instead
let myposition;//my location
let myusers={};//people who are sending me data
let markers={};// makers of every individual
let popups={};//popups of every individual
let watchid, mypopup, mymarker; //my data only watch id is used to clear the setInterval


//here is where the location service starts
//setinterval to get location every 5 seconds
async function getLocation() {
      if (navigator.geolocation) {
        watchid=navigator.geolocation.getCurrentPosition(recordPosition, failure, options);
      } else {
        alert("Geolocation is not supported by this browser.");
      }
    }

//success function for getCurrentPosition
//once we get the location we send through websocket to the server
//then we put ourselves on the map.
function recordPosition(position) {
  myposition=[position.coords.longitude,position.coords.latitude]; 
  
  let lonLat = new OpenLayers.LonLat( myposition[0] ,myposition[1] )
  .transform(
    new OpenLayers.Projection("EPSG:4326"), // transform from WGS 1984
    map.getProjectionObject() // to Spherical Mercator Projection
  );
  if ( mymarker ){
    map.removeLayer(mymarker);
  }
  if ( mypopup ){
    map.removePopup(mypopup);
  }
  mymarker = new OpenLayers.Layer.Markers( "Markers" );
  mymarker.addMarker(new OpenLayers.Marker(lonLat));
  map.addLayer(mymarker);
  
  map.setCenter(lonLat, zoom);
  mypopup= new OpenLayers.Popup.Anchored(
        "Popup", 
        lonLat,
        new OpenLayers.Size(50,15),
        "You",
        null,
        true
    );
  map.addPopup(mypopup)
}

//hndles failures of the getCurrentPosisiton
//retries infiniely to get the location
//clears the old location watchid
function failure(err){
  alert("Error getting your position", err.message, "Will retry");
  navigator.geolocation.getCurrentPosition(recordPosition, failure, options);
}

// plot other users on my map on gettting a message through websocket
function plotPosition(data) {
  let userposition=data.location;
  let lonLat = new OpenLayers.LonLat( userposition[0] ,userposition[1] )
  .transform(
    new OpenLayers.Projection("EPSG:4326"), // transform from WGS 1984
    map.getProjectionObject() // to Spherical Mercator Projection
  );
  //if iam a new user do below
  if (!myusers[data.from]){
    //perform actions to put him on the map
    markers[data.from] = new OpenLayers.Layer.Markers( "Markers" );
    myusers[data.from]=new OpenLayers.Marker(lonLat)
    map.addLayer(markers[data.from]);
    markers[data.from].addMarker(myusers[data.from]);
    popups[data.from]= new OpenLayers.Popup.Anchored(
        "Popup", 
        lonLat,
        new OpenLayers.Size(50,15),
        data.alias,
        null,
        true
    );
    map.addPopup(popups[data.from])
  } else {
    //if its an old user check if he is enabled and then only plot his position;
      //clearmarker
      // map.removeLayer(markers[data.from]);//to be removed after UAT
      // clear popup
      map.removePopup(popups[data.from]);
      //redraw
      markers[data.from].addMarker(myusers[data.from]);
      popups[data.from]= new OpenLayers.Popup.Anchored(
          "Popup", 
          lonLat,
          new OpenLayers.Size(50,15),
          data.alias,
          null,
          true
      );
      map.addPopup(popups[data.from])
    // not enabled users are already filtered in the filtering event;
  }
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
					$(`#services`).empty();
					for (const tracker of apifeedback.data.message){
						$(`#services`).append(`<option value="${tracker.phone}">${tracker.alias}:${tracker.phone}</option>`);
					}
				}
		});
		});


}

let myHostname = window.location.hostname;
let port= window.location.port

let env="api"
let base_url= `https://${myHostname}:${port}/${env}/`;


function toggleMenu(){
	$menu = $(`#myToggler .navbar-nav`);
	$menu.toggleClass('showmenu');
}

//loading modal to impress user :)
function toggleLoading(){
	$body = $("body");
	$body.toggleClass("loading");
}

$(document).ready(function(){
  //start the process after the page is fully loaded
    getLocation();
    getServices();
    $(`#searchForm`).submit((event)=>{
    	event.preventDefault();
		toggleLoading();
		const data = new FormData(event.target);
		const jsonData = Object.fromEntries(data.entries());
		jsonData.location = myposition

		fetch(`${base_url}search`,{
				method: 'POST',
				headers: {
		      		'Content-Type': 'application/json',
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
							$(`#searchFeedBack`).empty();
							for (const user of apifeedback.data.message){
								$(`#searchFeedBack`).append(`<p>${user.alias} is ${user.distance}Km from you</p>`)
								plotPosition(user);
							}
						} else {
							$(`#searchFeedBack`).html(`${apifeedback.data.message}, ${apifeedback.data.Reason}`);
						}
				});
				})
		});
});


function toggleModal(id){
	// Get the modal
	$modal = $(`#${id}`);
	$modal.toggleClass('show');

	document.getElementById("locationCompaint").value = myposition;

	var e = document.getElementById("services");
	var mobileNo = e.options[e.selectedIndex].value;
	document.getElementById("locationCompaintMobileNo").value = mobileNo;
}


// Modal for raise complaint

const raiseComplaint = document.getElementById('raiseComplaintModal');
raiseComplaint.addEventListener('submit', userComplaint);

function userComplaint(event){
	event.preventDefault();
	toggleLoading();
	const data = new FormData(event.target);
	const jsonData = Object.fromEntries(data.entries());

	console.log(data, jsonData)
	console.log(jsonData)
// Add new api end point replacing NEW_END_POINT
	fetch(`${base_url}NEW_END_POINT`,{
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
					toggleModal(`raiseComplaintModal`);
					raiseComplaint.reset();	
				} else {
					$(`#raiseComplaintfeedback`).html(apifeedback.data.message);
				}
		});
		})
}
