function myFunction(){
    var x = document.getElementById("file");
    var txt = "";
    if ('files' in x) {
        if (x.files.length != 0) {
            for (var i = 0; i < x.files.length; i++) {
                txt += (i+1) + ". ";
                var file = x.files[i];
                if ('name' in file) {
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

        var img = document.createElement("img");
        var reader = new FileReader();
        reader.onloadend = function() {
            img.src = reader.result;
        }
        reader.readAsDataURL(file);
        $(".myUpload").after(img);
    }
}