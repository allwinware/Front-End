var cnt = 1;

$(document).on("click", ".imggo", function () {

    var img = document.getElementById("img");

    if (cnt == 1) {
        img.src = "./image/ppt_02.jpg";
        cnt = 2;
    } else if (cnt == 2) {
        img.src = "./image/ppt_03.jpg";
        cnt = 3;
    } else if (cnt == 3) {
        img.src = "./image/ppt_04.jpg";
        cnt = 4;
    } else if (cnt == 4) {
        img.src = "./image/ppt_05.jpg";
        cnt = 5;
    } else if (cnt == 5) {
        img.src = "./image/ppt_06.jpg";
        cnt = 6;
    } else if (cnt == 6) {
        img.src = "./image/ppt_07.jpg";
        cnt = 7;
    } else if (cnt == 7) {
        img.src = "./image/ppt_08.jpg";
        cnt = 8;
    } else if (cnt == 8) {
        img.src = "./image/ppt_09.jpg";
        cnt = 9;
    } else if (cnt == 9) {
        img.src = "./image/ppt_01.jpg";
        cnt = 1;
    }

});
