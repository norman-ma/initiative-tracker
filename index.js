var conditions = [
    "blinded",
    "charmed",
    "deafened",
    "frightened",
    "grappled",
    "incapacitated",
    "invisible",
    "paralyzed",
    "petrified",
    "poisoned",
    "prone",
    "restrained",
    "stunned",
    "unconscious",
    "concentrating"
]

var state = getCookie() ? getCookie() : {
    creatures: [],
    edit: {
        mode: false,
        index: 0
    },
    current: 0
};

function updateCurrent(){
    var creature = state.creatures[state.current];
    var init_el = $('#current-initiative');
    var name_el = $('#current-name');
    var hp_el = $('#current-hp');
    init_el.empty();
    name_el.empty();
    hp_el.empty();
    let currStatus = $("#current-status");
    currStatus.empty();
    if(creature){
        $("#current").toggle(true);
        $("#headers").toggle(true);
        init_el.text(creature.initiative);
        name_el.text(creature.name);
        if(creature.temphp > 0){
            hp_el.append(`${creature.hp} <em class="temphp">(${creature.temphp})</em`);
        } else {
            hp_el.text(creature.hp);
        }
        if(creature.exhaustion > 0) {
            currStatus.append(`<div class="current-condition"><div class="title">EXHAUSTION</div><div class="value">${creature.exhaustion}</div></div>`);
        }
        for(let condition of conditions) {
            if(creature.status[condition]){
                currStatus.append(`<div class="current-condition">${condition.toUpperCase()}</div>`);
            }
        }
    } else {
        $("#current").toggle(false);
        $("#headers").toggle(false);
    }

    setCookie();
}

function addCreature() {
    let name_el = $("#creatureName");
    let initiative_el = $("#creatureInit");
    let hp_el = $("#creatureHP");
    if(state.edit.mode) {
        state.creatures[editIndex].name = name_el.val();
        state.creatures[editIndex].initiative = Number(initiative_el.val());
        state.creatures[editIndex].maxhp = Number(hp_el.val());
        state.creatures[editIndex].hp = Number(hp_el.val());
        state.edit.mode = false;
    } else {
        let creature = {
            name: name_el.val(),
            initiative: Number(initiative_el.val()),
            maxhp: Number(hp_el.val()),
            hp: Number(hp_el.val()),
            temphp: 0,
            status: {
                blinded: false, 
                charmed: false, 
                deafened: false, 
                frightened: false, 
                grappled: false, 
                incapacitated: false, 
                invisible: false, 
                paralyzed: false, 
                petrified: false, 
                poisoned: false, 
                prone: false, 
                restrained: false, 
                stunned: false, 
                unconscious: false, 
                concentrating: false
            },
            exhaustion: 0,
            isDead: false,
            displayConditions: false
        }
        state.creatures.push(creature);
    }
    
    buildList();

    name_el.val("");
    initiative_el.val(0);
    hp_el.val(0);
    $("#addCreature").toggle();
}

function duplicateCreature(index){
    var copy = JSON.parse(JSON.stringify(state.creatures[index]));
    state.creatures.push(copy);
    buildList();
}

function toggleEdit(index) {
    $("#addCreature").toggle();
    $("#addCreature h2").text("Edit Creature");
    $("#addCreatureBtn").text("Edit")

    let creature = state.creatures[index];
    $("#creatureName").val(creature.name);
    $("#creatureInit").val(creature.initiative);
    $("#creatureHP").val(creature.maxhp);

    state.edit.mode = true;
    state.edit.index = index;
}

function toggleAdd() {
    $("#addCreature").toggle();
    $("#addCreature h2").text("Add Creature");
    $("#addCreatureBtn").text("Add")
    state.edit.mode = false;
}

function toggleConditions(index) {
    state.creatures[index].displayConditions = !state.creatures[index].displayConditions;
    buildList();
}

function sortCreatures(){
    state.creatures.sort(function(a, b) {
        if (a.initiative == b.initiative) {
            if (a.name < b.name) {
                return -1
            } else if(a.name > b.name) {
                return 1
            } else {
                return 0
            }
        } else if (a.initiative > b.initiative) {
            return -1
        } else if(a.initiative < b.initiative) {
            return 1
        } else {
            return 0
        } 
    });
}

function buildList() {
    sortCreatures();
    $("#list").empty();
    for(let i = 0; i < state.creatures.length; i++){
        buildListItem(i);
    }
    updateCurrent();
}

function buildListItem(index) {
    if(state.creatures[index] && state.creatures[index].isDead) return;
    var creature = state.creatures[index];

    var listItem = $(`<div id="creature-${index}" class='listItem container-fluid'></div>`);

    var creatureInfo = $(`<div class='creatureInfo row'></div>`);
    creatureInfo.append(`<div><div class="title">INITIATIVE</div>${creature.initiative}</div>`);
    creatureInfo.append(`<div><div class="title">NAME</div><input id="name-${index}" class="name" value="${creature.name}" onchange="updateName(${index})"></div>`);
    var hp = $(`<div class="hp-container"><div class="title">HP <em class="temphp">(TEMP HP)</em></div></div>`);
    var hpArea = $(`<div id="hpArea-${index}" class='hpArea'><div id="hp-${index}" class="hp">${creature.hp}</div></div>`);
    hp.append(hpArea);
    creatureInfo.append(hp)
    creatureInfo.append(`<div class="options">
                            <div>
                                <div class="btn-group">
                                    <button class="btn edit-btn" onclick="toggleEdit(${index})"><img src="images/edit-icon.svg" alt="Edit" title="Edit" /></button>
                                    <button class="btn duplicate-btn" onclick="duplicateCreature(${index})"><img src="images/copy-icon.svg" alt="Duplicate" title="Duplicate" />
                                    </button><button class="btn delete-btn" onclick='deleteListItem(${index})'><img src="images/delete-icon.svg" alt="Delete" title="Delete" /></button>
                                </div>
                                <button class="btn btn-link" id="reset-${index}" onclick="reset(${index})">Reset</button>
                            </div>
                            <button id="toggle-status-${index}" class="btn toggle-status" title="Toggle Creature Status" onclick="toggleConditions(${index})"><img src="images/chevron-icon.svg" alt="Toggle Status" /></button>
                        </div>`);
    listItem.append(creatureInfo);

    var modHP = $(`<div id='modHP-${index}' class='modhp input-group'></div>`);
    modHP.append(`<input class="form-control" id='modHPValue-${index}' type='number'>`);
    modHP.append(`<input class="form-control" id='tempHPValue-${index}' type='number'>`);
    modHP.append(`<div class='modHPOptions btn-group-vertical'><button class="heal btn btn-primary" onclick="modHP(${index}, 'heal')">+</button><button class="damage btn btn-secondary" onclick="modHP(${index}, 'damage')">-</button></div>`);
    hpArea.append(modHP);

    var statusArea = $(`<div id='status-${index}' class='row statusArea' style="display: none;"></div>`);
    statusArea.append(`<div class="exhaustionArea"><div class="input-group"><span class="input-group-text exhaustion">EXHAUSTION:</span><input type='number' id='exhaustion-${index}' class="form-control exhaustion" min='0' max='6' value='${state.creatures[index].exhaustion}' onchange="updateExhaustion(${index})"/></div>`);
    var conditionArea = $("<div class='conditionArea'></div>");
    for(let condition of conditions ){
        var c = $(`<div class='condition input-group'><div class="input-group-text"><input type='checkbox' id='${condition}-${index}' class="form-check-input mt-0" onchange="toggleCondition(${index}, '${condition}')"}/></div><input class="form-control" value="${condition.toUpperCase()}" onclick="$('#${condition}-${index}').click()" readonly /></div>`);
        if(state.creatures[index].status[condition]){
            c.children('.input-group-text').children('input').prop('checked', true);
        }
        conditionArea.append(c);
    }
    statusArea.append(conditionArea);
    listItem.append(statusArea);
    $("#list").append(listItem);
    if(creature.temphp > 0){
        $(`#hp-${index}`).append(`<em class="temphp">(${creature.temphp})</em>`)
    }
    if(creature.displayConditions){
        $(`#status-${index}`).toggle(true);
    }
    if(creature.maxhp <= 0){
        $(`#hpArea-${index}`).empty();
    }
    if(creature.displayConditions) {
        $(`#toggle-status-${index} img`).addClass('rotate-up');
    } else {
        $(`#toggle-status-${index} img`).removeClass('rotate-up');
    }
    console.log(state.creatures);
}

function deleteListItem(index) {
    state.creatures.splice(index, 1);
    state.current = state.current % state.creatures.length
    if(isNaN(state.current)){
        state.current = 0;
    }
    buildList();
}

function reset(index) {
    state.creatures[index] = {
        name: state.creatures[index].name,
        initiative: state.creatures[index].initiative,
        maxhp: state.creatures[index].maxhp,
        hp: state.creatures[index].maxhp,
        temphp: 0,
        status: {
            blinded: false, 
            charmed: false, 
            deafened: false, 
            frightened: false, 
            grappled: false, 
            incapacitated: false, 
            invisible: false, 
            paralyzed: false, 
            petrified: false, 
            poisoned: false, 
            prone: false, 
            restrained: false, 
            stunned: false, 
            unconscious: false, 
            concentrating: false
        },
        exhaustion: 0,
        isDead: false,
        displayConditions: state.creatures[index].displayConditions
    }
    buildList();
}

function modHP(index, type) {
    var value = Number($(`#modHPValue-${index}`).val());
    var tempHp = Number($(`#tempHPValue-${index}`).val());

    if(type == 'damage') {
        if(state.creatures[index].temphp > 0){
            if(value > state.creatures[index].temphp) {
                value -= state.creatures[index].temphp;
                state.creatures[index].temphp = 0;
            } else {
                state.creatures[index].temphp -= value;
                value = 0;
            }
        }

        state.creatures[index].hp = state.creatures[index].hp - value;
        if(value > 0 && state.creatures[index].status.concentrating) {
            var dc = (value / 2) > 10 ? Math.round(value / 2) : 10
            alert(`Concentration Saving Throw - DC: ${dc}`);
        }
        if(state.creatures[index].hp <= 0) {
            if(confirm(`Is ${state.creatures[index].name} dead?`)) {
                state.creatures[index].isDead = true;
                deleteListItem(index);
            }
        }
    } else if(type == 'heal') {
        if(tempHp > 0) {
            state.creatures[index].temphp = tempHp > state.creatures[index].temphp ? tempHp : state.creatures[index].temphp;
        }
        state.creatures[index].hp = state.creatures[index].hp + value > state.creatures[index].maxhp ? state.creatures[index].maxhp : state.creatures[index].hp + value;
    }
    console.log(state.creatures[index], type, value);
    buildList();
}

function toggleCondition(index, condition) {
    state.creatures[index].status[condition] = !state.creatures[index].status[condition];
    buildList();
}

function updateExhaustion(index){
    var value = Number($(`#exhaustion-${index}`).val());
    state.creatures[index].exhaustion = value;
    updateCurrent();
}

function updateName(index){
    var value = $(`#name-${index}`).val();
    state.creatures[index].name = value;
    buildList();
}

function nextCreature(){
    if(state.creatures[state.current] && state.creatures[state.current].maxhp > 0 && state.creatures[state.current].hp <= 0 && !state.creatures[state.current].isDead) {
        if(confirm(`Is ${state.creatures[state.current].name} dead?`)) {
            state.creatures[state.current].isDead = true;
            deleteListItem(state.current);
        }
    }
    if(state.creatures.length > 0) {
        state.current = (state.current + 1) % state.creatures.length;
    } else {
        state.current = 0;
    }
    updateCurrent();
    window.scroll(0, $(`#creature-${state.current}`).offset().top - ($('#current').height() + 35))
}

function toggleAll(toggle) {
    for(let creature of state.creatures){
        creature.displayConditions = toggle;
    }
    buildList();
}

function clearAll() {
    state.creatures = []
    buildList();
}

function setCookie() {
    let val = JSON.stringify(state);
    let d = new Date()
    d.setTime(d.getTime() + (7*24*60*60*1000));

    document.cookie = "inittrakr=" + val + ";expires=" + d.toUTCString() + ";path=/";
    return(document.cookie);
}

function getCookie() {
    let decodedCookie = decodeURIComponent(document.cookie);
    let cookies = decodedCookie.split(";");
    for(let cookie of cookies) {
        while (cookie.charAt(0) == ' ') {
            cookie = cookie.substring(1);
        }
        if (cookie.indexOf('inittrakr=') == 0) {
            return JSON.parse(cookie.split('=')[1]);
        }
    }
    return false;
}

$(document).ready(function(){buildList();})