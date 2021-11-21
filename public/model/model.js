var MODEL = (function(){
    var _changeRoute = function(){
        let hashTag = window.location.hash;
        let pageID = hashTag.replace("#", "");
        //console.log(hashTag + " " + pageID);

        if(pageID != "") {
            $.get(`pages/${pageID}.html`, function(data) {
                //console.log("data " + data);
                $("#app").html(data);
                if (pageID == "createrecipe"){
                    $("#namedHeader").text(`Hey ${userFullName}, create your recipe!`);
                    ingrCount = 3;
                    instrCount = 3;
                } else if (pageID == "editrecipe"){
                    $("#namedHeader").text(`Hey ${userFullName}, edit your recipe!`);
                } else if (pageID == "yourrecipes"){
                     $("#namedHeader").text(`Hey ${userFullName}, here are your recipes!`);
                     loadUserRecipes();
                } 
            });
        } else {
            $.get(`pages/home.html`, function(data) {
                //console.log("data " + data);
                $("#app").html(data);
            });
        };
    };

    return {
        changeRoute: _changeRoute,
    }
})();