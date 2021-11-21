var _db = "";
var userExists = false;
var userFullName = "";
var _userProfileInfo = {};

//Function: Initializes listeners for page navigation options
function initListeners() {
    //Load new page content when anchor tags are clicked
    $(window).on("hashchange", MODEL.changeRoute);
    MODEL.changeRoute();
    //Toggle "active" class to open/close the nav menu when the icon is clicked
    $(".navBars").click(function(e){
        $(".navBars").toggleClass("active");
        $(".navLinks").toggleClass("active");
    });

    //Toggle "active" class to close the nav menu when a link is clicked
    $(".navLinks a").click(function(e){
        $(".navBars").toggleClass("active");
        $(".navLinks").toggleClass("active");
    });
}

//Function: Initializes firebase, handling user authentication and user data
// + related global variable values
function initFirebase(){
    firebase.auth().onAuthStateChanged((user) => {
        if(user){
            _db = firebase.firestore();
            console.log("Auth Change: Logged In");
            userExists = true;
            userFullName = user.displayName;
            $("#createrecipe").removeClass("hidden");
            $("#loginBtn").addClass("hidden");
            $("#logoutBtn").removeClass("hidden");
            $("#yourrecipes").removeClass("hidden");
            $(".foot__loginOnly").removeClass("hidden");
            $(".foot__logoutOnly").addClass("hidden");
        }else{
            _db = "";
            _userProfileInfo = {};
            console.log("Auth Change: Logged out");
            userExists = false;
            userFullName = "";
            $("#createrecipe").addClass("hidden");
            $("#loginBtn").removeClass("hidden");
            $("#logoutBtn").addClass("hidden");
            $("#yourrecipes").addClass("hidden");
            $(".foot__loginOnly").addClass("hidden");
            $(".foot__logoutOnly").removeClass("hidden");
        }
    })
}

//Function: Logs user out of the app, and displays an alert on success/error.
//Redirects user to the home page on successful sign out.
function signOut(){
    firebase.auth().signOut()
    .then(() => {
        console.log("signed out");
        location.hash = "home";
        Swal.fire(
            'You are Logged Out',
            'Come back soon!',
            'success'
          );
    })
    .catch((error) => {
        console.log("error signing out");
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Error Signing Out'
          });
    });
}

//Function: Takes data from the Create Account form and creates a user object
//in the Users collection on firebase. Uses email & password for authentication,
//and creates a user profile with an empty list for storing user recipes.
function createAccount() {
    console.log('Create');
    //Define the user object using form values from Create Account form
    let fName = $("#signUpFName").val();
    let lName = $("#signUpLName").val();
    let email = $("#signUpEmail").val();
    let pass = $("#signUpPass").val();
    let fullName = fName + " " + lName;
    let userObj = {
        firstName: fName,
        lastName: lName,
        email: email,
        recipes: [],
    };

    //Call function to create the user account on firebase
    firebase.auth().createUserWithEmailAndPassword(email, pass)
    .then((userCredential) => {
    // Signed in 
    var user = userCredential.user;
    console.log("created success");

    //Update the user's displayname in their profile to the full name entered
    firebase.auth().currentUser.updateProfile({
        displayName: fullName,
    });

    //Creates the user's profile info in the "Users" collection and sets the
    //_userProfileInfo variable using the data in the user object
    _db.collection("Users").doc(user.uid).set(userObj).then((doc) => {
        console.log('doc added');
        _userProfileInfo = userObj;
        console.log("create userinfo ", _userProfileInfo);   
    })
    .catch((error) => {
        var errorCode = error.code;
        var errorMessage = error.message;
        console.log("error adding doc " + errorMessage);
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Error adding user data'
          });
    });

    //Empties the signup form
    $("#signUpFName").val("");
    $("#signUpLName").val("");
    $("#signUpEmail").val("");
    $("#signUpPass").val("");
    userFullName = fullName;
    
    //Displays an alert notifying the user of successful account creation
    Swal.fire(
        'You are signed up!',
        'Welcome! Start creating recipes now!',
        'success'
      );
    })
    .catch((error) => {
    var errorCode = error.code;
    var errorMessage = error.message;
    console.log("create error " + errorMessage);
    Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Error creating account'
      });
    });
}

//Function: Takes data from the Login form and handles user authentication
function login() {
    //Passes the values from the login form to the firebase authentication
    //function, then clears the form and displays an alert showing successful
    //authentication.
    let email = $("#loginEmail").val();
    let pass = $("#loginPass").val();
    firebase.auth().signInWithEmailAndPassword(email, pass)
    .then((userCredential) => {
        // Signed in
        var user = userCredential.user;
        console.log("sign in successful");
        $("#loginEmail").val("");
        $("#loginPass").val("");
        Swal.fire(
            'You are Logged In!',
            'Welcome back!',
            'success'
          );

        //Loads user data and assigns it to the _userProfileInfo variable
        _db.collection("Users").doc(user.uid).get().then((doc) => {
            console.log(doc.data());
            _userProfileInfo = doc.data();
            console.log("login userinfo ", _userProfileInfo);
        })
        .catch((error) => {
            var errorCode = error.code;
            var errorMessage = error.message;
            console.log("error retrieving user data " + errorMessage);
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'Error retrieving user data'
              });
        });
    })
    .catch((error) => {
        var errorCode = error.code;
        var errorMessage = error.message;
        console.log("login error " + errorMessage);
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Error logging in'
          });
    });
}

//Function: Updates user info; Used as a component of add & update recipe functions
function updateUserInfo(userObj){
    let id = firebase.auth().currentUser.uid;
    _db.collection("Users").doc(id).update(userObj).then(() => {
        console.log("user data updated");
    })
    .catch((error) => {
        var errorCode = error.code;
        var errorMessage = error.message;
        console.log("error updating user data " + errorMessage);
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Error updating user data'
          });
    });
}

//Global variables: Provide initial default row count for addIngredient and 
//addInstruction functions. Values are altered by editRecipe function when
//generating the edit recipe form.
var ingrCount = 3;
var instrCount = 3;

//Function: Adds a new row to the Ingredients section of the add/edit recipe forms
//Assigns id's incrementally for new rows based on ingrCount variable
function addIngredient(){
    ingrCount++;
    $("#rcpIngr").append(`<input id="ingr${ingrCount}" type="text" placeholder="Ingredient #${ingrCount}">`);
    console.log(ingrCount);
}

//Function: Adds a new row to the Instructions section of the add/edit recipe forms
//Assigns id's incrementally for the new rows based on instrCount variable
function addInstruction(){
    instrCount++;
    $("#rcpInstr").append(`<input id="instr${instrCount}" type="text" placeholder="Instruction #${instrCount}">`);
    console.log(instrCount);
}

//Function: Takes the values entered in the create recipe form and adds the
//new recipe to the user's recipes. Then, redirects user to their recipes page
//and displays an alert notifying them that the recipe was added successfully
function addRecipe(){
    let newRcpImg = $("#rcpImg").val();
    let newRcpName = $("#rcpName").val();
    let newRcpDsc = $("#rcpDsc").val();
    let newRcpTime = $("#rcpTime").val();
    let newRcpSrv = $("#rcpSrv").val();
    let newRcpObj = {
        image: newRcpImg,
        name: newRcpName,
        description: newRcpDsc,
        time: newRcpTime,
        servings: newRcpSrv,
        ingredients: [],
        instructions: [],
    };
    $("#rcpIngr input").each(function(){
        newRcpObj.ingredients.push(this.value);
    });
    console.log(newRcpObj.ingredients);
    $("#rcpInstr input").each(function(){
        newRcpObj.instructions.push(this.value);
    });
    console.log(newRcpObj.instructions);
    console.log(newRcpObj);
    _userProfileInfo.recipes.push(newRcpObj);
    updateUserInfo(_userProfileInfo);
    location.hash = "yourrecipes";
    Swal.fire(
        'Success!',
        'Your recipe has been added',
        'success'
      );
      ingrCount = 3;
      instrCount = 3;
}

//Function: Generates an "edit" page for a recipe from the stored data in the 
//user's profile and sets the values in the form to the current values in the
//recipe object. Also sets ingrCount and instrCount variables to the # of rows
//in their respective sections
function editRecipe(rcpIndex) {
    let rcpObj = _userProfileInfo.recipes[rcpIndex];
    let editRcpString = `<div class="createRecipeContent">
    <form>
        <h1 id="namedHeader">Hey ${userFullName}, edit your recipe!</h1>
        <div class="recipeInfo">
            <input id="rcpImg" type="text">
            <div class="attachFileBtn">Attach File</div>
            <input id="rcpName" type="text">
            <input id="rcpDsc" type="text">
            <input id="rcpTime" type="text">
            <input id="rcpSrv" type="text">
        </div>
        <div class="recipeIngredients" id="rcpIngr">
            <h2>Enter Ingredients:</h2>`;
    $.each(rcpObj.ingredients, function (idx){
        let ingrNum = idx + 1;
        console.log(ingrNum);
        editRcpString += `<input type="text" id="ingr${ingrNum}">`;
    });
    editRcpString += `<div class="newRowBtn" onclick="addIngredient()">+</div>
    </div>
    <div class="recipeInstructions" id="rcpInstr">
        <h2>Enter Instructions:</h2>`;
    $.each(rcpObj.instructions, function (idx){
        let instrNum = idx + 1;
        console.log(instrNum);
        editRcpString += `<input type="text" id="instr${instrNum}">`;
    });
    editRcpString += `<div class="newRowBtn" onclick="addInstruction()">+</div>
    </div>
    <div class="submitRecipeBtn" id="submitRecipe" onclick="updateRecipe(${rcpIndex})">Submit Recipe</div>
    </form>
    </div>`;
    $("#app").html(editRcpString);
    $("#rcpImg").val(rcpObj.image);
    $("#rcpName").val(rcpObj.name);
    $("#rcpDsc").val(rcpObj.description);
    $("#rcpTime").val(rcpObj.time);
    $("#rcpSrv").val(rcpObj.servings);
    $.each(rcpObj.ingredients, function (idx, value){
        let ingrNum = idx + 1;
        let ingrName = value;
        console.log(ingrName);
        $(`#ingr${ingrNum}`).val(ingrName);
    });
    $.each(rcpObj.instructions, function (idx, value){
        let instrNum = idx + 1;
        let instrText = value;
        console.log(instrText);
        $(`#instr${instrNum}`).val(instrText);
    });
    ingrCount = rcpObj.ingredients.length;
    instrCount = rcpObj.instructions.length;
}

//Function: Takes the updated recipe form from editRecipe and replaces the 
//old recipe object at the same index in the user's recipe collection. Then,
//reloads the yourrecipes page and displays an alert showing successful update
function updateRecipe(rcpIndex){
    let updateRcpImg = $("#rcpImg").val();
    let updateRcpName = $("#rcpName").val();
    let updateRcpDsc = $("#rcpDsc").val();
    let updateRcpTime = $("#rcpTime").val();
    let updateRcpSrv = $("#rcpSrv").val();
    let updateRcpObj = {
        image: updateRcpImg,
        name: updateRcpName,
        description: updateRcpDsc,
        time: updateRcpTime,
        servings: updateRcpSrv,
        ingredients: [],
        instructions: [],
    };
    $("#rcpIngr input").each(function(){
        updateRcpObj.ingredients.push(this.value);
    });
    console.log(updateRcpObj.ingredients);
    $("#rcpInstr input").each(function(){
        updateRcpObj.instructions.push(this.value);
    });
    console.log(updateRcpObj.instructions);
    console.log(updateRcpObj);
    _userProfileInfo.recipes.splice(rcpIndex, 1, updateRcpObj);
    updateUserInfo(_userProfileInfo);
    //Load the Your Recipes page, load user recipes and display an alert 
    // notifying the user of a successful update.
    $.get(`pages/yourrecipes.html`, function(data){
        $("#app").html(data);
        loadUserRecipes();
    });
    Swal.fire(
        'Success!',
        'Your recipe was updated!',
        'success'
      );
      ingrCount = 3;
      instrCount = 3;
}

//Function: Populates the gallery in the yourrecipes page with all recipes
//stored in the user's profile info.
function loadUserRecipes(){
    let rcpString = ``;
    $.each(_userProfileInfo.recipes, function(idx, recipe){
        rcpString += `<div class="yourrecipesItem" id="${idx}">
        <div class="galleryItem">
            <div class="galleryImage">
                <img class="galleryImage" src="images/browse/${recipe.image}" alt="${recipe.name}">
                <div class="recipeBtn viewBtn" id="viewrecipe" onclick="viewRecipe(${idx})">View</div>
            </div>
            <div class="galleryText">
                <h2>${recipe.name}</h2>
                <p>${recipe.description}</p>
                <div class="galleryTextIconBlock">
                    <img src="images/browse/time.svg" alt="cook time">
                    <p>${recipe.time}</p>
                </div>
                <div class="galleryTextIconBlock">
                    <img src="images/browse/servings.svg" alt="# of servings">
                    <p>${recipe.servings} servings</p>
                </div>
            </div>
        </div>
        <div class="btnEditDeleteContainer">
            <div class="recipeBtn editBtn" onclick="editRecipe(${idx})">Edit Recipe</div>
            <div class="recipeBtn deleteBtn" onclick="deleteRecipe(${idx})">Delete</div>
        </div>
    </div>`
    });
    $("#rcpGallery").html(rcpString);
}

//Function: Removes a recipe at a given index from the user's profile, and 
//reloads the user's recipe gallery. Displays an alert on success or failure.
function deleteRecipe(rcpIndex) {
    try {
        _userProfileInfo.recipes.splice(rcpIndex, 1);
        updateUserInfo(_userProfileInfo);
        loadUserRecipes();
        Swal.fire(
            'Success!',
            'Recipe deleted',
            'success'
          );
    }catch(error){
        console.log("error deleting recipe ", error);
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Error deleting recipe'
          });        
    }
}


//Function: Generates a detailed view page of a recipe at a given index
function viewRecipe(rcpIndex){
    let rcpObj = _userProfileInfo.recipes[rcpIndex];
    let rcpString = `<div class="viewrecipe">
    <div class="recipeHeadDesc">
        <div class="recipeImgHead">
            <h2>${rcpObj.name}</h2>
            <img src="images/browse/${rcpObj.image}" alt="${rcpObj.name}">
        </div>
        <div class="recipeDesc">
            <h2>Description:</h2>
            <p>${rcpObj.description}</p>
            <h2>Total Time:</h2>
            <p>${rcpObj.time}</p>
            <h2>Servings:</h2>
            <p>${rcpObj.servings} servings</p>
        </div>
    </div>
        <div class="recipeIngr">
            <h2>Ingredients:</h2>`;
    $.each(rcpObj.ingredients, function (idx, value){
        let ingrNum = idx + 1;
        let ingrName = value;
        console.log(ingrName);
        rcpString += `<p id="ingr${ingrNum}">${ingrName}</p>`;
    });
    rcpString += `</div>
    <div class="recipeInstr">
    <h2>Instructions:</h2>`;
    $.each(rcpObj.instructions, function (idx, value){
        let instrNum = idx + 1;
        let instrText = value;
        rcpString += `<p id="instr${instrNum}">${instrNum}. ${instrText}</p>`
    });
    rcpString += `</div>
        <div class="recipeBtn editBtn" onclick="editRecipe(${rcpIndex})">Edit Recipe</div>
    </div>`;
    $("#app").html(rcpString);
}


//Function: Loads firebase and initial listeners on page load
$(document).ready(function() {
    try {
        let app = firebase.app();
        initFirebase();
        initListeners();
    }catch(error){
        console.log("error loading page ", error);
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Error loading page'
          });
    }
});