function myFunction(){
    var x = document.getElementById("file");
    var txt = "";
    var fileName = "";
    if ('files' in x) {
        if (x.files.length != 0) {
            for (var i = 0; i < x.files.length; i++) {
                txt += (i+1) + ". ";
                var file = x.files[i];
                if ('name' in file) {
                    fileName = file.name;
                    txt += "Название: " + file.name + "<br>";
                }
            }
        }
    } 
    else {
        if (x.value == "") {
            txt += "Выберите один или несколько файлов.";
        } else {
            txt += "Свойство файлов не поддерживается в вашем браузере!";
            txt  += "<br>Путь выбранного файла: " + x.value; // If the browser does not support the files property, it will return the path of the selected file instead. 
        }
    }
    document.getElementById("demo").innerHTML = txt;

	for (var i = 0; i < x.files.length; i++) {

        var file = x.files[i];

        //var img = document.createElement("img");
        var setImage = document.getElementById("loadImage");
        var imageLink = document.getElementById("imageLink");
        var image = document.getElementById("image");

        var reader = new FileReader();
        reader.onloadend = function() {
            setImage.src = reader.result;
            var base64 = reader.result ;
            imageLink.value = fileName;
        }
        reader.readAsDataURL(file);
    }
}