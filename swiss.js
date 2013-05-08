$(document).ready(function() {
    "use strict";

  function shuffleArray(arr) {
    var i;
    for (i = arr.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1)),
            tmp = arr[i];
        arr[i] = arr[j];
        arr[j] = tmp;
    }

    return arr;
  };
  
  var roundNumber = 0;

  function newPlayer(name) {
    return {
      name: name,
      wins: 0,
      draws: 0,
      losses: 0
      };

  }

  //matchups should be
  //[
  //  {p1: player, p2: player}
  //]
  //
  //score can be omitted
  function Round(matchUps) {
    //TODO: remove when debugign obver
    this.matchups = matchUps;
    var scoresSaved = false,
        thisRound   = roundNumber;
    roundNumber++;

    //matchups will also have element score: [p1 wins, draw, p2 wins]

    //TODO: gughhh
    function updateScores() {
      var scores = $('table#round-' + roundNumber + ' input[type=number]'),
          i = 0;
      scores.each(function() {
        var score = $(this),
            name =  score.data('playername'),
            mu;
        for (i = 0; i < matchUps.length; i++) {
          if (matchUps[i].p1.name === name || matchUps[i].p2.name === name) {
            mu = matchUps[i];
            break;
          }
        }

        var amt = parseInt(score.val());
        if (!mu.score) {
          mu.score = [0, 0, 0];
        }

        if (score.hasClass('draws')) {
          mu.score[1] += amt;
        } else { //wins
          if (mu.p1.name === name) {
            mu.score[0] += amt;
          } else {
            mu.score[2] += amt;
          }
        }
      });
      for (i = 0; i < matchUps.length; i++) {
        var mu = matchUps[i],
            p1Wins = mu.score[0],
            p2Wins = mu.score[2];
        if (p1Wins > p2Wins) {
          mu.p1.wins++;
          mu.p2.losses++;
        } else if (p2Wins > p1Wins) {
          mu.p2.wins++;
          mu.p1.losses++;
        } else {
          mu.p1.draws++;
          mu.p2.draws++;
        }
      }

      scoresSaved = true;
    }

    this.buildHtml = function() {
      var table = 
        '<table id="round-' + roundNumber + '" >' + 
          '<thead>' + 
            '<tr>' +
              '<td>Player One</td>' +
              '<td>P1 Wins</td>' + 
              '<td>Draws</td>' + 
              '<td>P2 Wins</td>' + 
              '<td>Player Two</td>';
      table +=
            '</tr>' +
          '</thead>' +
          '<tbody>';

      for (var i = 0; i < matchUps.length; i++) {
        var mu = matchUps[i];
        table += '<tr><td>' + mu.p1.name + '</td>';
        if (!mu.score) {
          mu.score = [0,0,0];
        }
        if (!scoresSaved) {
          table += '<td><input type="number" class="wins" value="' + mu.score[0] + '" data-playername="' + mu.p1.name + '" /></td>';
          table += '<td><input type="number" class="draws" value="' + mu.score[1] + '" data-playername="' + mu.p1.name + '" /></td>';
          table += '<td><input type="number" class="wins" value="' + mu.score[2] + '" data-playername="' + mu.p2.name + '" /></td>';
        } else {
          table += '<td>' + mu.score[0] + '</td>';
          table += '<td>' + mu.score[1] + '</td>';
          table += '<td>' + mu.score[2] + '</td>';
        }

        table += '<td>' + mu.p2.name + '</td>';
        table += '</tr>';
      }
      table += '</tbody></table>';
      if (!scoresSaved) {
        table += '<input type="button" value="Submit score" class="submit-scores" data-round="' + roundNumber + '" />';
      }
      return table;
    };

    $(document).on('click', '.submit-scores', updateScores);
  }

  function Bracket(playerList, el) {
    var started = false;
        this.rounds = [];
    
    this.start = function() {
      if (started) {
        return false;
      }
      var matchups = generateMatchups();
      var newRound = new Round(matchups);
      this.rounds.push(newRound);
      //el.html(newRound.buildHtml(true));
      started = true;
      return true;
    };

    this.draw = function() {
      var html = '';
      for (var i = 0; i < this.rounds.length; i++) {
        html += this.rounds[i].buildHtml();
      }
      el.html(html);
    };

    var getScore = function(player) {
      return player.wins * 3 + player.draws;
    }

    /**
     * returns groups of players by score
     * already in even-numbered groups, with a bye
     * added to the last group if necessary
     */
    var groupPlayers = function(players) {
      var out = [],
          indices = [];
      for (var i in players) {
        var player = players[i];
        var score = getScore(player);
        if (!out[score]) {
          out[score] = [];
        }
        out[score].push(player);
      }
      for (var i in out) {
        if (out.hasOwnProperty) {
        indices.push(i);
        }
      }
      //we want the lowest scoring group to have the bye
      //if at all possible
      indices.sort();
      indices.reverse();
      for (var i = 0; i < indices.length; i++) {
        var s = indices[i];
        if (out[s].length % 2 === 1) {
          if (i === indices.length - 1) {
            out[s].push(playerList.getBye());
          } else {
            var tmpPlayer = out[s].shift();
            out[indices[i+1]].push(tmpPlayer);
          }
        }
      }
      return out;
    }

    var generateMatchups = function() {
      var scoreGroups = groupPlayers(playerList.players);
      var matchups = [];
      for (var s in scoreGroups) {
        var players = scoreGroups[s];
        for (var i = 0; i < players.length; i += 2) {
          if (i + 1 == players.length) {
            matchups.push({p1: players[i], p2: PlayerList.getBye()});
          } else {
            matchups.push({p1: players[i], p2: players[i+1]});
          }
        }
      }

      return matchups;
    }
  }

  function PlayerList(el) {
    var getBye = function() {
      return {name: 'Bye', wins: 0, losses: 0, draws: 0};
    }

    this.players = {};
    this.addPlayer = function(playerName) {
      if (this.players[playerName]) {
        return false;
      }
      this.players[playerName] = newPlayer(playerName);
      return true;
    };

    this.draw = function() {
      var items = [];
      for (var i in this.players) {
        var record = this.players[i];
        if (record.draws === 0) {
          var score = record.wins + ' - ' + record.losses;
        } else {
          var score = record.wins + ' - ' + record.draws + ' - ' + record.losses;
        }
        items.push('<li>' + i + ' | ' + score + '</li>');
      }
      el.html(items.join(''));
    };

    this.getPlayers = function() {
      var ps = [];
      for (var i in this.players) {
        ps.push(this.players[i]);
      }
      return ps;
    };
  }

  var addPlayerButton = $('#add-player'),
      addPlayerInput = $('#player-name'),
      createBracketButton = $('#create-bracket'),
      newPlayerMsg = $('#new-player-msg'),
      playerList = new PlayerList($('ol#playerList')),
      bracket = null;

  function addPlayer(name) {
    var added = playerList.addPlayer(name);
    if (!added) {
      newPlayerMsg.text('Failed to add ' + name + '. This player might already exist.');
      return;
    }
    playerList.draw();

  }

  addPlayerButton.on('click', function(e) {
    e.preventDefault();
    addPlayer(addPlayerInput.val().trim());
  });

  createBracketButton.on('click', function(e) {
    e.preventDefault();
    bracket = new Bracket(playerList, $('#bracket'));
    bracket.start();
    bracket.draw();
  });

  $('#ds').on('click', function(e) {
    e.preventDefault();
    console.log(JSON.stringify(playerList));
    console.log(JSON.stringify(bracket));
  });

  addPlayer('Alice');
  addPlayer('Bob');
});

