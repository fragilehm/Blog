$(document).ready(function(){
	// $(window).scroll(function() {
 //    	if ($(this).scrollTop() > 0) {
 //        	$("h2").css({'position':'fixed', 'top' : '0', 'opacity' : '0.7'});
 //        	$("h2 span").css({'display' : 'block', 'transform': 'translateX(-400px)'});
 //    	} else {
	//     	$("h2").css({'position': 'initial', 'opacity' : '1'});
	//     	$("h2 span").css({'display' : 'block', 'transform': 'translateX(0px)'});
 //    	}
	// });
    $(window).scroll(function() {
        if ($(this).scrollTop() > 284) {
            $(".filter_block").css({'position' : 'fixed', 'top' : '0', 'left' : '220px', 'width' : '1000px'});
        } else {
            $(".filter_block").css({'position' : 'initial', 'width' : 'initial'});
        }
    });
    // $('.menu_list > ul > li').click(function() {
    //     if($(this).hasClass('active'))
    //     {
    //         $(this).removeClass('active').addClass('inactive');
    //     }
    //     else
    //     {
    //         $(this).removeClass('inactive').addClass('active');
    //     }
    // });
    //   $('#userNumber').inputmask({ 
    //     mask: "*{1,20}[.*{1,20}][.*{1,20}][.*{1,20}]@*{1,20}[.*{2,6}][.*{1,2}]", clearIncomplete: true,
    //     greedy: false,
    //     onBeforePaste: function (pastedValue, opts) {
    //     pastedValue = pastedValue.toLowerCase();
    //     return pastedValue.replace("mailto:", "");
    // },
    // definitions: {
    //   '*': {
    //     validator: "[0-9A-Za-z!#$%&'*+/=?^_`{|}~\-]",
    //     cardinality: 1,
    //     casing: "lower"
    //   }
    // },
    //     onincomplete : function(){
    //     $(this).parent('.form__inp-field').addClass('error').removeClass('active');
    //     $(this).next('em').remove();
    //     },
    //     oncomplete: function(){
    //         $(this).parent('.inp_field').removeClass('error').addClass('active');
    //         $(this).next('em').remove();
    //     }
    // });
});
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

