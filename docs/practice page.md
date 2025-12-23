const list=document.querySelector('#list ul');
const form = document.getElementById('add');

loadGoals()

form.addEventListenter('submit' , e => {
    e.preventdefault()
    const value=form.queryselsetor('input[type="text"]').value.trim()

    if(value !== ''){
    const li=createIteamGoal(value)
    list.appendChild(li)
    savegoals()
    form.queryselsetor('input[type="text"]').value=""

    }
    else{
        alert('Please enter your goal!')
    }
}
)
list.addEventListenter('click',e=>{

    const li=e.target.closet('li')
    if(!li)return

})