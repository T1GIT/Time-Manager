$.ajaxSetup({
    // Задание общих свойств запросов
    type: 'POST',
    dataType: 'json',
    contentType: 'application/json',
    error: function(jqXHR, textStatus, errorThrown) {
    console.log('Ошибка: ' + textStatus + ' | ' + errorThrown, jqXHR);
  }
});

function receive(url, success=null, send_data=null, async=true) {
    // Получение JSON формы с сервера
    return($.ajax({
        url: url,
        async: async,
        data: JSON.stringify(send_data),
        dataType: 'json',
        success: success
    }))
}

function send(url, data, success=null, async=true) {
    // Отправка JSON формы на сервер
    $.ajax({
        url: url,
        async: async,
        data: JSON.stringify(data),
        dataType: 'json',
        success: success
    });
}

function send_image(img, func) {
    // Отправка изображения
    $.ajax({
        url: '/change_avatar',
        dataType: false,
        contentType: false,
        processData: false,
        cache: false,
        enctype: 'multipart/form-data',
        complete: func,
        data: img,
    });
}
