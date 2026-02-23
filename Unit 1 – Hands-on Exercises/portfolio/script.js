const tl = gsap.timeline();

tl.from(".nav-title" , {
    y: -100,
    opacity:0,
    duration:0.5,
    delay:0.33,
})
tl.from(".hero-image" , {
    x: 1700,
    opacity:0,
    duration:0.4,
    rotate:360
})
tl.from(".menu-item" , {
    y: 75,
    opacity:0,
    duration:0.2,
    stagger:0.25
})
 
tl.from(".skills-item", {
    x: 500,
    opacity:0,
    duration:0.2,
    stagger:0.25

})