function a() {
    console.log('Hello world');
    setTimeout(a, 2000);
}

a();