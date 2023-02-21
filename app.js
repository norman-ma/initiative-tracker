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
            message: ""
        };

        $scope.toggleAdd = () => {
            $scope.popup.creature = {
                name: "",
                initiative: 0,
                maxhp: 0,
                hp: 0,
                ac: 0,
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
                modhp: {
                    hp: 0,
                    temphp: 0
                },
                exhaustion: 0,
                isDead: false,
                displayConditions: false
            }
            $scope.popup.buttonText = "Add";
            $scope.popup.display = !$scope.popup.display;
        }

        $scope.toggleEdit = (index) => {
            $scope.popup.creature = JSON.parse(JSON.stringify($scope.state.creatures[index]));
            $scope.popup.buttonText = "Edit";
            $scope.popup.display = !$scope.popup.display;
            $scope.popup.edit.status = true;
            $scope.popup.edit.index = index;
        }

        $scope.popupSubmit = () => {
            $scope.popup.creature.hp = $scope.popup.creature.maxhp;
            if($scope.popup.edit.status) {
                $scope.state.creatures[$scope.popup.edit.index] = $scope.popup.creature;
                $scope.popup.edit.status = false;
            } else {
                $scope.state.creatures.push($scope.popup.creature);
            }
            $scope.popup.display = false;
        }

        $scope.toggleConditions = (index) => {
            $scope.state.creatures[index].displayConditions = !$scope.state.creatures[index].displayConditions;
        }

        $scope.toggleAlert = (display, message) => {
            $scope.alert.display = display;
            if(display) {
                $scope.alert.message = message;
                $('html, body').animate({scrollTop: $(`#alert`).offset().top - ($('#current').height() + 35)});
            }
        }

        $scope.clearAll = () => {
            $scope.state.creatures = [];
        }

        $scope.sort = () => {
            $scope.state.creatures.sort(function(a, b) {
                if (a.initiative == b.initiative) {
                    if (a.name < b.name) {
                        return -1;
                    } else if(a.name > b.name) {
                        return 1;
                    } else {
                        return 0;
                    }
                } else if (a.initiative > b.initiative) {
                    return -1;
                } else if(a.initiative < b.initiative) {
                    return 1;
                } else {
                    return 0;
                } 
            });
        }

        $scope.next = () => {
            if($scope.state.creatures.length > 0) {
                $scope.state.current = ($scope.state.current + 1) % $scope.state.creatures.length;
            } else {
                state.current = 0;
            }
            $('html, body').animate({scrollTop: $(`#creature-${$scope.state.current}`).offset().top - ($('#current').height() + 35)});
        };

        $scope.duplicate = (index) => {
            $scope.state.creatures.push(JSON.parse(JSON.stringify($scope.state.creatures[index])));
        };

        $scope.delete = (index) => {
            $scope.state.creatures.splice(index, 1);
        };

        $scope.reset = (index) => {
            $scope.state.creatures[index] = {
                name: $scope.state.creatures[index].name,
                initiative: $scope.state.creatures[index].initiative,
                maxhp: $scope.state.creatures[index].maxhp,
                hp: $scope.state.creatures[index].maxhp,
                ac: $scope.state.creatures[index].ac,
                temphp: 0,
                modhp: {
                    hp: 0,
                    temphp: 0
                },
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
                displayConditions: $scope.state.creatures[index].displayConditions
            }
        }

        $scope.toggleAll = (toggle) => {
            for(let creature of $scope.state.creatures){
                creature.displayConditions = toggle;
            }
        };

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
                    $scope.toggleAlert(true,`Concentration Save. DC(${dc})`);
                }
                if(creature.maxhp > 0 && creature.hp <= 0) {
                    $scope.toggleAlert(true,`${creature.name} is dead`);
                    $scope.delete(index);
                }
            } else if (type == 'heal') {
                if(temphp > 0) {
                    creature.temphp = temphp > creature.temphp ? temphp : creature.temphp;
                }
                creature.hp = creature.hp + hp > creature.maxhp ? creature.maxhp : creature.hp + hp;
            }

            creature.modhp.hp = 0;
            creature.modhp.temphp = 0;
        };

        $scope.profileMgr = {
            toggled: false,
            name: "",
            profileList: [],
            current: null
        };

        let compress = (state) => {
            let tiny = {
                creatures: [],
                current: state.current
            };

            for(let creature of state.creatures){
                let critter=[];
                critter.push(creature.name);
                critter.push(creature.initiative);
                critter.push(creature.maxhp);
                critter.push(creature.hp);
                critter.push(creature.ac);
                critter.push(creature.temphp);
                let stat_list = []
                for(s of Object.keys(creature.status)){
                    if(creature.status[s]){
                        stat_list.push(s);
                    }
                }
                critter.push(stat_list);
                critter.push(creature.exhaustion);
                tiny.creatures.push(critter);
            }

            return tiny;
        };

        let decompress = (tiny) => {
            let state = {
                creatures: [],
                current: tiny.current
            };

            for(let critter of tiny.creatures) {
                let creature = {
                    name: critter[0],
                    initiative: critter[1],
                    maxhp: critter[2],
                    hp: critter[3],
                    ac: critter[4],
                    temphp: critter[5],
                    modhp: {
                        hp: 0,
                        temphp: 0
                    },
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
                    exhaustion: critter[7],
                    isDead: false,
                    displayConditions: false
                };
                for(s of critter[6]){
                    creature.status[s] = true;
                };
                state.creatures.push(creature);
            }

            return state;
        }

        $scope.toggleProfileMgr = (val) => {
            if(val){
                $scope.profileMgr.toggled = val;
            } else {
                $scope.profileMgr.toggled = !$scope.profileMgr.toggled;
            }
            if(!$scope.profileMgr.toggled){
                $scope.profileMgr.current = null;
            }
        }
        $scope.setCurrentProfile = (profile) => {
            $scope.profileMgr.current = profile;
        }
        $scope.saveProfile = () => {
            let cookieName = `inittrakr-${$scope.profileMgr.name}`;
            let d = new Date();
            d.setTime(d.getTime() + (7*24*60*60*1000));
            $cookies.remove(cookieName);
            $cookies.put(cookieName, JSON.stringify(compress($scope.state)), {expires: d});
            $scope.profileName = "";
            $scope.buildProfileList();
            $scope.profileMgr.toggled = false;
        };
        $scope.loadProfile = (index) => {
            let profile = $scope.profileMgr.profileList[index];
            $scope.state = JSON.parse(JSON.stringify(profile.value));
            $scope.profileMgr.name = profile.name;
            $scope.profileMgr.toggled = false;
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
                if(key.indexOf('inittrakr') == 0 && key.length > 10){
                    $scope.profileMgr.profileList.push({
                        name: key.substring(10),
                        value: decompress(JSON.parse($cookies.get(key)))
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
    