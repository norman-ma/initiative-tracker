angular.module("inittrakrApp", ['ngCookies'])
    .controller('AppController', [ '$scope', '$cookies', function($scope, $cookies){
        console.log($scope.state)
        $scope.popup = {
            display: false,
            creature: null,
            buttonText: 'Add',
            edit: {
                status: false,
                index: 0
            }
        }

        $scope.alert = {
            display: false,
            message: ""
        }

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
            console.log($scope.popup)
        }

        $scope.toggleEdit = (index) => {
            $scope.popup.creature = $scope.state.creatures[index]
            $scope.popup.buttonText = "Edit"
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
            }
        }

        $scope.clearAll = () => {
            $scope.state.creatures = []
        }

        $scope.sort = () => {
            $scope.state.creatures.sort(function(a, b) {
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

        $scope.next = () => {
            if($scope.state.creatures.length > 0) {
                $scope.state.current = ($scope.state.current + 1) % $scope.state.creatures.length;
            } else {
                state.current = 0;
            }
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
        }

        $scope.state = $cookies.get('inittrakr') ? JSON.parse($cookies.get('inittrakr')) : {
            creatures: [],
            current: 0
        };

        $scope.$watch('state', function(){
            let d = new Date();
            d.setTime(d.getTime() + (7*24*60*60*1000));
            $cookies.put("inittrakr", JSON.stringify($scope.state), {expires: d});
            $scope.sort();
        });
    }])