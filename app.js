angular.module("inittrakrApp", ['ngCookies'])
    .directive("contenteditable", function () {
        return {
            restrict: "A",
            require: "ngModel",
            link: function (scope, element, attrs, ngModel) {
                // read is the main handler, invoked here by the blur event
                function read() {
                    // Keep the newline value for substitutin
                    // when cleaning the <br>
                    var newLine = String.fromCharCode(10);
                    // Firefox adds a <br> for each new line, we replace it back
                    // to a regular '\n'
                    var formattedValue = element.html().replace(/<br>/ig,newLine).replace(/\r/ig,'');
                    // update the model
                    ngModel.$setViewValue(formattedValue);
                    // Set the formated (cleaned) value back into
                    // the element's html.
                    element.text(formattedValue);
                }

                ngModel.$render = function () {
                    element.html(ngModel.$viewValue || "");
                };

                element.bind("blur", function () {
                    // update the model when
                    // we loose focus
                    scope.$apply(read);
                });
                element.bind("keydown", function (event) {
                    // blur on ENTER
                    var key = event.keyCode ? event.keyCode : event.which;
                    if(key == '13') {
                        event.preventDefault();
                        event.target.blur();
                    }
                });
                element.bind("paste", function(e){
                    // This is a tricky one
                    // when copying values while
                    // editing, the value might be
                    // copied with formatting, for example
                    // <span style="line-height: 20px">copied text</span>
                    // to overcome this, we replace
                    // the default behavior and
                    // insert only the plain text
                    // that's in the clipboard
                    e.preventDefault();
                    document.execCommand('inserttext', false, e.clipboardData.getData('text/plain'));
                });
            }
        }
    })
    .controller('AppController', [ '$scope', '$cookies', function($scope, $cookies){

        $scope.state = {
            creatures: [],
            current: 0
        };

        $scope.popup = {
            display: false,
            creature: null,
            buttonText: 'Add',
            edit: {
                status: false,
                index: 0
            }
        };

        $scope.alert = {
            display: false,
            title: "",
            message: ""
        };

        $scope.settingMgr = {
            toggled: false,
            settings: [
                {
                    name: 'autoreroll',
                    description: 'Automatically reroll HP when duplicating creatures. (DND MODE ONLY)',
                    value: false
                },
                {
                    name: 'pf2emode',
                    description: 'Use Pathfinder 2nd Edition stats/rules',
                    value: false
                }
            ],
            temp: [],
            validate: () => {
                let valid = true;
                if($scope.state.creatures.length > 0) {
                    if($scope.settingMgr.temp[1].value){
                        valid = valid && $scope.state.creatures[0].mode == 'pf2e';
                    } else {
                        valid = valid && $scope.state.creatures[0].mode == 'dnd';
                    }
                    if(!valid){
                        $scope.toggleAlert(true, "Cannot Change Mode", "Mode must be consistent across all creatures.")
                    }
                }
                return valid;
            }
        };

        const copy = (obj) => {
            return JSON.parse(JSON.stringify(obj));
        }

        $scope.modes = {
            dnd: {
                conditions: {
                    bool: {
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
                    num: {
                        exhaustion: 0
                    }
                }
            },
            pf2e: {
                dc: {
                    ac: {
                        base: 0,
                        val: 0
                    },
                    willDC: {
                        base: 0,
                        val: 0
                    },
                    reflexDC: {
                        base: 0,
                        val: 0
                    },
                    fortDC: {
                        base: 0,
                        val: 0
                    },
                    actions: {
                        base: 3,
                        val: 3
                    },
                    level: 0
                },
                conditions: {
                    bool: {
                        blinded: false,
                        confused: false,
                        controlled: false,
                        dazzled: false,
                        deafened: false,
                        encumbered: false,
                        fascinated: false,
                        fatigued: false,
                        fleeing: false,
                        grabbed: false,
                        immobolized: false,
                        invisible: false,
                        paralyzed: false,
                        petrified: false,
                        prone: false,
                        restrained: false,
                        unconscious: false
                    },
                    num: {
                        clumsy: 0,
                        enfeebled: 0,
                        stupified: 0,
                        drained: 0,
                        frightened: 0,
                        sickened: 0,
                        stunned: 0,
                        quickened: 0,
                        slowed: 0,
                        stunned: 0,
                        wounded: 0,
                        doomed: 0,
                        dying: 0
                    }
                }
                //TODO add persistent damage handler
            }
        }
        let descriptions = {
            dnd: {
                blinded: "A blinded creature can’t see and automatically fails any ability check that requires sight. Attack rolls against the creature have advantage, and the creature’s Attack rolls have disadvantage.",
                charmed: "A charmed creature can’t attack the charmer or target the charmer with harmful Abilities or Magical Effects. The charmer has advantage on any ability check to interact socially with the creature.",
                deafened: "A deafened creature can’t hear and automatically fails any ability check that requires hearing.",
                frightened: "A frightened creature has disadvantage on ability checks and attack rolls while the source of its fear is within Line of Sight. The creature can’t willingly move closer to the source of its fear.",
                grappled: "A grappled creature’s speed becomes 0, and it can’t benefit from any bonus to its speed. The condition ends if the Grappler is incapacitated (see the condition). The condition also ends if an Effect removes the grappled creature from the reach of the Grappler or Grappling Effect, such as when a creature is hurled away by the thunderwave spell.",
                incapacitated: "An incapacitated creature can’t take actions or reactions.",
                invisible: "An invisible creature is impossible to see without the aid of magic or a Special sense. For the Purpose of hiding, the creature is heavily obscured. The creature’s Location can be detected by any noise it makes or any tracks it leaves. Attack rolls against the creature have disadvantage, and the creature’s Attack rolls have advantage.",
                paralyzed: "A paralyzed creature is incapacitated (see the condition) and can’t move or speak. The creature automatically fails Strength and Dexterity saving throws. Attack rolls against the creature have advantage. Any attack that hits the creature is a critical hit if the attacker is within 5 feet of the creature.",
                petrified: "A petrified creature is Transformed, along with any nonmagical object it is wearing or carrying, into a solid inanimate substance (usually stone). Its weight increases by a factor of ten, and it ceases aging. The creature is incapacitated (see the condition), can’t move or speak, and is unaware of its surroundings. Attack rolls against the creature have advantage. The creature automatically fails Strength and Dexterity saving throws. The creature has resistance to all damage. The creature is immune to poison and disease, although a poison or disease already in its system is suspended, not neutralized.",
                poisoned: "A poisoned creature has disadvantage on attack rolls and ability checks.",
                prone: "A prone creature’s only movement option is to crawl, unless it stands up and thereby ends the condition. The creature has disadvantage on attack rolls. An attack roll against the creature has advantage if the attacker is within 5 feet of the creature. Otherwise, the Attack roll has disadvantage.",
                restrained: "A restrained creature’s speed becomes 0, and it can’t benefit from any bonus to its speed. Attack rolls against the creature have advantage, and the creature’s Attack rolls have disadvantage. The creature has disadvantage on Dexterity saving throws.",
                stunned: "A stunned creature is incapacitated (see the condition), can’t move, and can speak only falteringly. The creature automatically fails Strength and Dexterity saving throws. Attack rolls against the creature have advantage.",
                unconscious: "An unconscious creature is incapacitated (see the condition), can’t move or speak, and is unaware of its surroundings The creature drops whatever it’s holding and falls prone. The creature automatically fails Strength and Dexterity saving throws. Attack rolls against the creature have advantage. Any attack that hits the creature is a critical hit if the attacker is within 5 feet of the creature.",
                concentrating: "The following factors can break concentration: Casting another spell that requires Concentration. You lose Concentration on a spell if you cast another spell that requires Concentration. You can’t concentrate on two Spells at once. Taking Damage. Whenever you take damage while you are concentrating on a spell, you must make a Constitution saving throw to maintain your Concentration. The DC equals 10 or half the damage you take, whichever number is higher. If you take damage from multiple sources, such as an arrow and a dragon’s breath, you make a separate saving throw for each source of damage. Being Incapacitated or killed. You lose Concentration on a spell if you are Incapacitated or if you die.",
                exhaustion: "1 Disadvantage on ability checks, 2 Speed halved, 3 Disadvantage on attack rolls and saving throws, 4 Hit point maximum halved, 5 Speed reduced to 0, 6 Death"
            },
            pf2e: {
                blinded: "You can't see. All normal terrain is difficult terrain to you. You can't detect anything using vision. You automatically critically fail Perception checks that require you to be able to see, and if vision is your only precise sense, you take a –4 status penalty to Perception checks and all creatures are hidden to you. You are immune to visual effects. Blinded overrides dazzled.",
                confused: "You don't have your wits about you, and you attack wildly. You are flat-footed, you don't treat anyone as your ally (though they might still treat you as theirs), and you can't Delay, Ready, or use reactions. You use all your actions to Strike or cast offensive cantrips, though the GM can have you use other actions to facilitate attack, such as draw a weapon, move so that a target is in reach, and so forth. Your targets are determined randomly by the GM. If you have no other viable targets, you target yourself, automatically hitting but not scoring a critical hit. If it's impossible for you to attack or cast spells, you babble incoherently, wasting your actions. Each time you take damage from an attack or spell, you can attempt a DC 11 flat check to recover from your confusion and end the condition.",
                controlled: "Someone else is making your decisions for you, usually because you're being commanded or magically dominated. The controller dictates how you act and can make you use any of your actions, including attacks, reactions, or even Delay. The controller usually does not have to spend their own actions when controlling you.",
                dazzled: "Your eyes are overstimulated. If vision is your only precise sense, all creatures and objects are concealed from you (Flat DC 5 check).",
                deafened: "You can't hear. You automatically critically fail Perception checks that require you to be able to hear. You take a –2 status penalty to Perception checks for initiative and checks that involve sound but also rely on other senses. If you perform an action with the auditory trait, you must succeed at a DC 5 flat check or the action is lost; attempt the check after spending the action but before any effects are applied. You are immune to auditory effects.",
                encumbered: "You are carrying more weight than you can manage. While you’re encumbered, you’re clumsy 1 and take a 10-foot penalty to all your Speeds. As with all penalties to your Speed, this can’t reduce your Speed below 5 feet.",
                fascinated: "You are compelled to focus your attention on something, distracting you from whatever else is going on around you. You take a –2 status penalty to Perception and skill checks, and you can't use actions with the concentrate trait unless they or their intended consequences are related to the subject of your fascination (as determined by the GM). For instance, you might be able to Seek and Recall Knowledge about the subject, but you likely couldn't cast a spell targeting a different creature. This condition ends if a creature uses hostile actions against you or any of your allies.",
                fatigued: "You're tired and can't summon much energy. You take a –1 status penalty to AC and saving throws. You can't use exploration activities performed while traveling",
                fleeing: "You're forced to run away due to fear or some other compulsion. On your turn, you must spend each of your actions trying to escape the source of the fleeing condition as expediently as possible (such as by using move actions to flee, or opening doors barring your escape). The source is usually the effect or caster that gave you the condition, though some effects might define something else as the source. You can't Delay or Ready while fleeing.",
                grabbed: "You're held in place by another creature, giving you the flat-footed and immobilized conditions. If you attempt a manipulate action while grabbed, you must succeed at a DC 5 flat check or it is lost; roll the check after spending the action, but before any effects are applied.",
                immobolized: "You can't use any action with the move trait. If you're immobilized by something holding you in place and an external force would move you out of your space, the force must succeed at a check against either the DC of the effect holding you in place or the relevant defense (usually Fortitude DC) of the monster holding you in place.",
                invisible: "While invisible, you can't be seen. You're undetected to everyone. Creatures can Seek to attempt to detect you; if a creature succeeds at its Perception check against your Stealth DC, you become hidden to that creature until you Sneak to become undetected again. If you become invisible while someone can already see you, you start out hidden to the observer (instead of undetected) until you successfully Sneak. You can't become observed while invisible except via special abilities or magic.",
                paralyzed: "Your body is frozen in place. You have the flat-footed condition and can't act except to Recall Knowledge and use actions that require only the use of your mind (as determined by the GM). Your senses still function, but only in the areas you can perceive without moving your body, so you can't Seek while paralyzed.",
                petrified: "You have been turned to stone. You can’t act, nor can you sense anything. You become an object with a Bulk double your normal Bulk (typically 12 for a petrified Medium creature or 6 for a petrified Small creature), AC 9, Hardness 8, and the same current Hit Points you had when alive. You don’t have a Broken Threshold. When you’re turned back into flesh, you have the same number of Hit Points you had as a statue. If the statue is destroyed, you immediately die. While petrified, your mind and body are in stasis, so you don’t age or notice the passing of time.",
                prone: "You're lying on the ground. You are flat-footed and take a –2 circumstance penalty to attack rolls. The only move actions you can use while you're prone are Crawl and Stand. Standing up ends the prone condition. You can Take Cover while prone to hunker down and gain greater cover against ranged attacks, even if you don't have an object to get behind, gaining a +4 circumstance bonus to AC against ranged attacks (but you remain flat-footed). If you would be knocked prone while you're Climbing or Flying, you fall (see Falling for the rules on falling). You can't be knocked prone when Swimming.",
                restrained: "You're tied up and can barely move, or a creature has you pinned. You have the flat-footed and immobilized conditions, and you can't use any actions with the attack or manipulate traits except to attempt to Escape or Force Open your bonds. Restrained overrides grabbed.",
                unconscious: "You're sleeping, or you've been knocked out. You can't act. You take a –4 status penalty to AC, Perception, and Reflex saves, and you have the blinded and flat-footed conditions. When you gain this condition, you fall prone and drop items you are wielding or holding unless the effect states otherwise or the GM determines you're in a position in which you wouldn't. If you're unconscious because you're dying, you can't wake up while you have 0 Hit Points. If you are restored to 1 Hit Point or more via healing, you lose the dying and unconscious conditions and can act normally on your next turn. If you are unconscious and at 0 Hit Points, but not dying, you naturally return to 1 Hit Point and awaken after sufficient time passes. The GM determines how long you remain unconscious, from a minimum of 10 minutes to several hours. If you receive healing during this time, you lose the unconscious condition and can act normally on your next turn. (Lookup condition for more)",
                clumsy: "Your movements become clumsy and inexact. Clumsy always includes a value. You take a status penalty equal to the condition value to Dexterity-based checks and DCs, including AC, Reflex saves, ranged attack rolls, and skill checks using Acrobatics, Stealth, and Thievery.",
                enfeebled: "You're physically weakened. Enfeebled always includes a value. When you are enfeebled, you take a status penalty equal to the condition value to Strength-based rolls and DCs, including Strength-based melee attack rolls, Strength-based damage rolls, and Athletics checks.",
                stupified: "Your thoughts and instincts are clouded. Stupefied always includes a value. You take a status penalty equal to this value on Intelligence-, Wisdom-, and Charisma-based checks and DCs, including Will saving throws, spell attack rolls, spell DCs, and skill checks that use these ability scores. Any time you attempt to Cast a Spell while stupefied, the spell is disrupted unless you succeed at a flat check with a DC equal to 5 + your stupefied value.",
                drained: "When a creature successfully drains you of blood or life force, you become less healthy. Drained always includes a value. You take a status penalty equal to your drained value on Constitution-based checks, such as Fortitude saves. You also lose a number of Hit Points equal to your level (minimum 1) times the drained value, and your maximum Hit Points are reduced by the same amount. For example, if you’re hit by an effect that inflicts drained 3 and you’re a 3rd-level character, you lose 9 Hit Points and reduce your maximum Hit Points by 9. Losing these Hit Points doesn’t count as taking damage.",
                frightened: "You’re gripped by fear and struggle to control your nerves. The frightened condition always includes a value. You take a status penalty equal to this value to all your checks and DCs. Unless specified otherwise, at the end of each of your turns, the value of your frightened condition decreases by 1.",
                sickened: "You feel ill. Sickened always includes a value. You take a status penalty equal to this value on all your checks and DCs. You can't willingly ingest anything—including elixirs and potions—while sickened. You can spend a single action retching in an attempt to recover, which lets you immediately attempt a Fortitude save against the DC of the effect that made you sickened. On a success, you reduce your sickened value by 1 (or by 2 on a critical success).",
                quickened: "You gain 1 additional action at the start of your turn each round. Many effects that make you quickened specify the types of actions you can use with this additional action. If you become quickened from multiple sources, you can use the extra action you’ve been granted for any single action allowed by any of the effects that made you quickened. Because quickened has its effect at the start of your turn, you don’t immediately gain actions if you become quickened during your turn.",
                slowed: "You have fewer actions. Slowed always includes a value. When you regain your actions at the start of your turn, reduce the number of actions you regain by your slowed value. Because slowed has its effect at the start of your turn, you don't immediately lose actions if you become slowed during your turn.",
                stunned: "You've become senseless. You can't act while stunned. Stunned usually includes a value, which indicates how many total actions you lose, possibly over multiple turns, from being stunned. Each time you regain actions (such as at the start of your turn), reduce the number you regain by your stunned value, then reduce your stunned value by the number of actions you lost. For example, if you were stunned 4, you would lose all 3 of your actions on your turn, reducing you to stunned 1; on your next turn, you would lose 1 more action, and then be able to use your remaining 2 actions normally. Stunned might also have a duration instead of a value, such as “stunned for 1 minute.” In this case, you lose all your actions for the listed duration. Stunned overrides slowed. If the duration of your stunned condition ends while you are slowed, you count the actions lost to the stunned condition toward those lost to being slowed. So, if you were stunned 1 and slowed 2 at the beginning of your turn, you would lose 1 action from stunned, and then lose only 1 additional action by being slowed, so you would still have 1 action remaining to use that turn",
                wounded: "You have been seriously injured. If you lose the dying condition and do not already have the wounded condition, you become wounded 1. If you already have the wounded condition when you lose the dying condition, your wounded condition value increases by 1. If you gain the dying condition while wounded, increase your dying condition value by your wounded value. The wounded condition ends if someone successfully restores Hit Points to you with Treat Wounds, or if you are restored to full Hit Points and rest for 10 minutes.",
                doomed: "A powerful force has gripped your soul, calling you closer to death. Doomed always includes a value. The dying value at which you die is reduced by your doomed value. If your maximum dying value is reduced to 0, you instantly die. When you die, you're no longer doomed.",
                dying: "You are bleeding out or otherwise at death’s door. While you have this condition, you are unconscious . Dying always includes a value, and if it ever reaches dying 4, you die. If you’re dying, you must attempt a recovery check at the start of your turn each round to determine whether you get better or worse. Your dying condition increases by 1 if you take damage while dying, or by 2 if you take damage from an enemy’s critical hit or a critical failure on your save. If you lose the dying condition by succeeding at a recovery check and are still at 0 Hit Points, you remain unconscious, but you can wake up as described in that condition. You lose the dying condition automatically and wake up if you ever have 1 Hit Point or more. Any time you lose the dying condition, you gain the wounded 1 condition, or increase your wounded condition value by 1 if you already have that condition."
            }
        }
        /**
         * Describes condition based on mode
         * @param {String} condition
         * @returns {String} description
         */
        $scope.describe = (condition) => {
            if($scope.getSetting('pf2emode')){
                return descriptions.pf2e[condition];
            } else {
                return descriptions.dnd[condition];
            }
        };

        $scope.toggleAdd = () => {
            $scope.popup.creature = {
                name: "",
                initiative: 0,
                hptext: "",
                maxhp: 0,
                hp: 0,
                ac: 0,
                dc: $scope.getSetting('pf2emode') ? copy($scope.modes.pf2e.dc) : null,
                temphp: 0,
                status: $scope.getSetting('pf2emode') ? copy($scope.modes.pf2e.conditions) : copy($scope.modes.dnd.conditions),
                modhp: {
                    hp: 0,
                    temphp: 0
                },
                isDead: false,
                displayConditions: false,
                mode: $scope.getSetting('pf2emode') ? 'pf2e' : 'dnd'
            }
            $scope.popup.buttonText = "Add";
            $scope.popup.display = !$scope.popup.display;
        };

        $scope.toggleEdit = (index) => {
            $scope.popup.creature = copy($scope.state.creatures[index]);
            $scope.popup.buttonText = "Edit";
            $scope.popup.display = !$scope.popup.display;
            $scope.popup.edit.status = true;
            $scope.popup.edit.index = index;
        };

        $scope.popupSubmit = () => {
            let val = 0
            if($scope.getSetting('pf2emode')){
                val = $scope.popup.creature.maxhp;
                for(let dc in $scope.popup.creature.dc){
                    $scope.popup.creature.dc[dc].val = $scope.popup.creature.dc[dc].base
                }
            } else {
                let text = $scope.popup.creature.hptext.toUpperCase();
                val = $scope.rollHP(text);
            }
            if(val) {
                $scope.popup.creature.maxhp = val;
                $scope.popup.creature.hp = val;
            } else {
                return;
            }
            if($scope.popup.edit.status) {
                $scope.popup.creature.hp = $scope.popup.creature.maxhp;
                $scope.state.creatures[$scope.popup.edit.index] = $scope.popup.creature;
                $scope.popup.edit.status = false;
            } else {
                $scope.state.creatures.push($scope.popup.creature);
            }
            $scope.popup.display = false;
        };

        $scope.toggleSettingMgr = (toggle, save=false) => {
            $scope.settingMgr.toggled = toggle;
            if(toggle){
                $scope.settingMgr.temp = copy($scope.settingMgr.settings);
            } else {
                if(save && $scope.settingMgr.validate()) {
                    $scope.settingMgr.settings = copy($scope.settingMgr.temp);
                } else {
                    $scope.settingMgr.temp = null;
                }
            }
        }

        $scope.getSetting = (name) => {
            for(let setting of $scope.settingMgr.settings) {
                if(setting.name == name){
                    return setting.value;
                }
            }
        }

        $scope.rollDice = (num, dice, bonus, average=false) => {
            if(![4, 6, 8, 10, 12, 20].includes(dice)) {
                $scope.toggleAlert(true, "Invalid Die", "Die value must be 4, 6, 8, 10, 12 or 20");
                return false;
            }
            let result = 0;
            list = [];
            if (average) {
                let avgVal = (dice + 1) / 2
                result = Math.floor(avgVal * num);
            } else {
                for(let i = 0; i < num; i++) {
                    diceVal = Math.ceil(Math.random() * dice);
                    list.push(diceVal);
                    result += diceVal;
                }
            }
            console.log(`${num}D${dice}+${bonus}${average ? '*' : ''}`, `(${result+bonus})`, list);
            return result + bonus;
        };

        $scope.rollHP = (text) => {
            let regex_dice = new RegExp('^\\d+(D|d)\\d+(\\+\\d+)?\\*?$');
            let regex_num = new RegExp('^\\d+$');
            if(regex_dice.test(text)){
                let roll = {
                    num: parseInt(text.slice(0, text.indexOf('D'))),
                    dice: text.indexOf('+') >= 0 ? parseInt(text.slice(text.indexOf('D') + 1, text.indexOf('+'))) : parseInt(text.slice(text.indexOf('D') + 1, 0)),
                    bonus: text.indexOf('+') >= 0 ? parseInt(text.slice(text.indexOf('+') + 1)) : 0,
                    avg: text.indexOf('*') >= 0
                }
                let val = $scope.rollDice(roll.num, roll.dice, roll.bonus, roll.avg);
                if(val){
                    return val;
                } else {
                    return false;
                }
            } else if(regex_num.test(text)) {
                return parseInt(text)
            } else {
                $scope.toggleAlert(true, "Incorrect HP Format", "Please enter either a number or hit dice eg. 10d8+30. If you use the hit dice format you can add an * at the end to use the average.");
                return false;
            }
        }

        $scope.toggleConditions = (index) => {
            $scope.state.creatures[index].displayConditions = !$scope.state.creatures[index].displayConditions;
        };

        $scope.updateCondition = (index, condition="", value=0) => {
            let creature = $scope.state.creatures[index];
            if(typeof(value) == 'boolean') {
                creature.status.bool[condition] = !creature.status.bool[condition];
            }
            if($scope.getSetting('pf2emode')) {
                let defpen = creature.status.num.frightened + creature.status.num.sickened
                if(creature.status.bool.fatigued){
                    defpen++;
                }
                let ffpen = creature.status.bool.confused || creature.status.bool.grabbed || creature.status.bool.paralyzed || creature.status.bool.prone || creature.status.bool.restrained || creature.status.bool.unconscious ? 2 : 0
                if(creature.status.bool.restrained){
                    creature.status.bool.immobolized = creature.status.bool.restrained;
                }
                if(creature.status.bool.encumbered && creature.status.num.clumsy < 1){
                    creature.status.num.clumsy = 1;
                }
                if(condition == 'drained') {
                    let hppen = (creature.status.num.drained - value) * creature.dc.level;
                    creature.maxhp -= hppen;
                    if(hppen > 0){
                        creature.hp -= hppen;
                    }
                    $scope.handleDeath(index);
                }
                creature.dc.ac.val = creature.dc.ac.base - ( ffpen + defpen + creature.status.num.clumsy);
                creature.dc.fortDC.val = creature.dc.fortDC.base - (defpen + creature.status.num.drained);
                creature.dc.reflexDC.val = creature.dc.reflexDC.base - (defpen + creature.status.num.clumsy);
                creature.dc.willDC.val = creature.dc.willDC.base - (defpen + creature.status.num.stupified);
            } else {
                if(creature.status.bool.paralyzed || creature.status.bool.petrified || creature.status.bool.stunned || creature.status.bool.unconscious) {
                    creature.status.bool.incapacitated = true;
                }
            }
        }

        $scope.toggleAlert = (display, title, message) => {
            $scope.alert.display = display;
            if(display) {
                $scope.alert.title = title;
                $scope.alert.message = message;
            }
        };

        $scope.scrollToCurrent = () => {
            $('html, body').animate({scrollTop: $(`#creature-${$scope.state.current}`).offset().top - ($('#current').height() + 35)});
        };

        $scope.$watch(function() { return $scope.alert.display && $('#alert').is(':visible') }, function() {
            if($('#alert').is(':visible')){
                $('html, body').animate({scrollTop: $('#alert').offset().top - ($('#current').height() + 35)});
            }
        });

        $scope.clearAll = () => {
            $scope.state.creatures = [];
        }

        $scope.sort = () => {
            $scope.state.creatures.sort(function(a, b) {
                if (a.initiative == b.initiative) {
                    return a.name.localeCompare(b.name, undefined, {
                        numeric: true,
                        sensitivity: 'base'
                    });
                } else if (a.initiative > b.initiative) {
                    return -1;
                } else if(a.initiative < b.initiative) {
                    return 1;
                } else {
                    return 0;
                }
            });
        };

        $scope.next = () => {
            if($scope.getSetting('pf2emode')) {
                let creature = $scope.state.creatures[$scope.state.current];
                creature.status.num.frightened--;
                if(creature.status.num.frightened < 0){
                    creature.status.num.frightened = 0;
                }
            }
            if($scope.state.creatures.length > 0) {
                $scope.state.current = ($scope.state.current + 1) % $scope.state.creatures.length;
            } else {
                $scope.state.current = 0;
            }
            if($scope.getSetting('pf2emode')) {
                let creature = $scope.state.creatures[$scope.state.current];
                if(creature) {
                    let actionsGained = creature.dc.actions.base + creature.status.num.quickened;
                    let actionsLost = 0;
                    if(creature.status.num.stunned >= actionsGained) {
                        actionsLost = actionsGained;
                        creature.status.num.stunned -= actionsGained;
                    } else if(creature.status.num.slowed > actionsGained){
                        actionsLost = actionsGained;
                    } else {
                        actionsLost = creature.status.num.stunned > creature.status.num.slowed ? creature.status.num.stunned : creature.status.num.slowed;
                        creature.status.num.stunned = 0;
                    }
                    creature.dc.actions.val = actionsGained - actionsLost;
                }
            }
            $scope.scrollToCurrent();
        };

        $scope.duplicate = (index) => {
            let regex_count = new RegExp('\\(\\d+\\)$');
            let newCreature = copy($scope.state.creatures[index]);
            if(regex_count.test(newCreature.name)) {
                var index = newCreature.name.match(regex_count).index;
                var nameStr = newCreature.name.slice(0, index);
                var countStr = newCreature.name.slice(index + 1);
                var count = parseInt(countStr);
                var new_name = `${nameStr}(${count + 1})`;
                newCreature.name = new_name
            } else {
                newCreature.name = `${newCreature.name}(2)`
            }
            if(!$scope.getSetting('pf2emode')) {
                if($scope.getSetting('autoreroll')){
                    newCreature.maxhp = $scope.rollHP(newCreature.hptext.toUpperCase());
                    newCreature.hp = newCreature.maxhp
                }
            }
            $scope.state.creatures.push(newCreature);
        };

        $scope.delete = (index) => {
            $scope.state.creatures.splice(index, 1);
        };

        $scope.reset = (index) => {
            $scope.state.creatures[index] = {
                name: $scope.state.creatures[index].name,
                initiative: $scope.state.creatures[index].initiative,
                hptext: $scope.state.creatures[index].hptext,
                maxhp: $scope.state.creatures[index].maxhp,
                hp: $scope.state.creatures[index].maxhp,
                ac: $scope.state.creatures[index].ac,
                dc: $scope.state.creatures[index].dc,
                temphp: 0,
                status: $scope.getSetting('pf2emode') ? copy($scope.modes.pf2e.conditions) : copy($scope.modes.dnd.conditions),
                modhp: {
                    hp: 0,
                    temphp: 0
                },
                isDead: false,
                displayConditions: false,
                mode: $scope.getSetting('pf2emode') ? 'pf2e' : 'dnd'
            };
            $scope.updateCondition(index);
        };

        $scope.toggleAll = (toggle) => {
            for(let creature of $scope.state.creatures){
                creature.displayConditions = toggle;
            }
        };

        /**
         *
         * @param {Number} index
         * @param {String} type
         * Accepted Strings: damage, heal
         */
        $scope.modHP = (index, type) => {
            let hp = $scope.state.creatures[index].modhp.hp;
            let temphp = $scope.state.creatures[index].modhp.temphp;
            let creature = $scope.state.creatures[index]
            if(type == 'damage') {
                if(creature.temphp > 0){
                    if(hp > creature.temphp) {
                        hp -= creature.temphp;
                        creature.temphp = 0;
                    } else {
                        creature.temphp -= hp;
                        hp = 0;
                    }
                }
                creature.hp = creature.hp - hp;
                if(hp > 0 && creature.status.concentrating) {
                    let dc = (hp / 2) > 10 ? Math.round(hp / 2) : 10
                    $scope.toggleAlert(true, 'Concentration', `Concentration Save. DC(${dc})`);
                }
                $scope.handleDeath(index);
            } else if (type == 'heal') {
                if(temphp > 0) {
                    creature.temphp = temphp > creature.temphp ? temphp : creature.temphp;
                }
                creature.hp = creature.hp + hp > creature.maxhp ? creature.maxhp : creature.hp + hp;
            }

            creature.modhp.hp = 0;
            creature.modhp.temphp = 0;
        };

        $scope.handleDeath = (index) => {
            let creature = $scope.state.creatures[index]
            if(creature.maxhp > 0 && creature.hp <= 0) {
                $scope.toggleAlert(true,'Creature Death', `${creature.name} is dead`);
                $scope.delete(index);
            }
        }

        $scope.profileMgr = {
            toggled: false,
            name: "",
            profileList: [],
            current: null
        };

        /**
         * Converts state to smaller object for cookies
         * @param {Object} state
         * @param {Array.<Boolean>} settings
         * @typedef StatePackage
         * @type {object}
         * @property {Array} creatures
         * @property {Number} current
         * @property {Array} settings
         * @returns {StatePackage}
         *
         * Creature attribute index
         * 0    name
         * 1    initiative
         * 2    hptext
         * 3    maxhp
         * 4    hp
         * 5    ac
         * 6    temphp
         * 7    status.bool
         * 8    status.num
         * 9    mode
         * 10   ac
         * 11   fortDC
         * 12   reflexDC
         * 13   willDC
         * 14   actions
         */
        let pack = (state, settings) => {
            let tiny = {
                creatures: [],
                current: state.current,
                settings: []
            };

            for(let creature of state.creatures){
                let critter=[];
                critter.push(creature.name);
                critter.push(creature.initiative);
                critter.push(creature.hptext);
                critter.push(creature.maxhp);
                critter.push(creature.hp);
                critter.push(creature.ac);
                critter.push(creature.temphp);
                let bool = []
                for(let s of Object.keys(creature.status.bool)){
                    if(creature.status.bool[s]){
                        bool.push(s);
                    }
                }
                critter.push(bool);
                let num = []
                for(let s of Object.keys(creature.status.num)){
                    if(creature.status.num[s] > 0){
                        num.push([s, creature.status[s]]);
                    }
                }
                critter.push(num);
                critter.push(creature.mode);
                if(creature.mode == 'pf2e') {
                    critter.push(creature.dc.ac.base);
                    critter.push(creature.dc.fortDC.base);
                    critter.push(creature.dc.reflexDC.base);
                    critter.push(creature.dc.willDC.base);
                    critter.push(creature.dc.actions.base);
                }
                tiny.creatures.push(critter);
            }

            tiny.settings = settings.map(setting => setting.value);
            return tiny;
        };

        /**
         *
         * @param {StatePackage} tiny
         *
         * @typedef State
         * @type {object}
         * @property {Array} creatures
         * @property {Number} current
         *
         * @typedef UnpackedState
         * @type {object}
         * @property {State} state
         * @property {Array} settings
         * @returns {UnpackedState}
         */
        let unpack = (tiny) => {
            let state = {
                creatures: [],
                current: tiny.current
            };
            let settings = copy($scope.settingMgr.settings);

            for(let critter of tiny.creatures) {
                let creature = {
                    name: critter[0],
                    initiative: critter[1],
                    hptext: critter[2],
                    maxhp: critter[3],
                    hp: critter[4],
                    ac: critter[5],
                    temphp: critter[6],
                    modhp: {
                        hp: 0,
                        temphp: 0
                    },
                    status: critter[9] == 'pf2e' ? $scope.modes.pf2e.conditions : $scope.modes.dnd.conditions,
                    mode: critter[9],
                    dc: critter[9] == 'pf2e' ? $scope.modes.pf2e.dc : null,
                    isDead: false,
                    displayConditions: false
                };
                for(s of critter[7]){
                    creature.status.bool[s] = true;
                };
                for(s of critter[8]){
                    creature.status.bool[s[0]] = s[1];
                };
                if(creature.mode == "pf2e") {
                    creature.dc.ac.base = critter[10];
                    creature.dc.ac.val = critter[10];
                    creature.dc.fortDC.base = critter[11];
                    creature.dc.fortDC.val = critter[11];
                    creature.dc.reflexDC.base = critter[12];
                    creature.dc.reflexDC.val = critter[12];
                    creature.dc.willDC.base = critter[13];
                    creature.dc.willDC.val = critter[13];
                    creature.dc.actions.base = critter[14];
                    creature.dc.actions.val = critter[14];
                }

                
                state.creatures.push(creature);
            }

            for(let i = 0; i < tiny.settings.length; i++){
                settings[i].value = tiny.settings[i];
            }

            return {
                state: state,
                settings: settings
            };
        };

        $scope.toggleProfileMgr = (val) => {
            if(val){
                $scope.profileMgr.toggled = val;
            } else {
                $scope.profileMgr.toggled = !$scope.profileMgr.toggled;
            }
            if(!$scope.profileMgr.toggled){
                $scope.profileMgr.current = null;
            }
        };
        $scope.setCurrentProfile = (profile) => {
            $scope.profileMgr.current = profile;
        };
        $scope.saveProfile = () => {
            let cookieName = `inittrakr-${$scope.profileMgr.name}`;
            let d = new Date();
            d.setTime(d.getTime() + (7*24*60*60*1000));
            $cookies.remove(cookieName);
            $cookies.put(cookieName, JSON.stringify(pack($scope.state, $scope.settingMgr.settings)), {expires: d});
            $scope.profileName = "";
            $scope.buildProfileList();
            $scope.profileMgr.toggled = false;
        };
        $scope.loadProfile = (index) => {
            let profile = $scope.profileMgr.profileList[index];
            $scope.state = copy(profile.value.state);
            $scope.settingMgr.settings = copy(profile.value.settings);
            $scope.profileMgr.name = profile.name;
            $scope.profileMgr.toggled = false;
            for(let i = 0; i < $scope.state.creatures.length; i++) {
                $scope.updateCondition(i);
            }
        };
        $scope.deleteProfile = (index) => {
            let profile = $scope.profileMgr.profileList[index];
            $cookies.remove(`inittrakr-${profile.name}`);
            $scope.buildProfileList();
        };

        $scope.buildProfileList = () => {
            var list = $cookies.getAll();
            $scope.profileMgr.profileList = [];
            for(let key of Object.keys(list)){
                if(key.indexOf('inittrakr-') == 0 && key.length > 10){
                    $scope.profileMgr.profileList.push({
                        name: key.substring(10),
                        value: unpack(JSON.parse($cookies.get(key)))
                    });
                }
            }
            if($scope.profileMgr.profileList.length == 0) {
                $scope.profileMgr.current = null;
            }
        };
        $scope.buildProfileList();
        $scope.$watch('state', $scope.sort, true);
    }])
    