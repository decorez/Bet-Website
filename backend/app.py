from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import random

app = Flask(__name__)
CORS(app)

class SlotMachineLogic:
    def __init__(self):
        self.symbols = ['🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍒', '🥭', '🥝']
        self.WINNING_ODDS = {
            "three_match": 0.15,
            "four_match": 0.08,
            "five_match": 0.03
        }

    def generate_spin_result(self):
        random_chance = random.random()
        result = []

        if random_chance < self.WINNING_ODDS["five_match"]:
            symbol = random.choice(self.symbols)
            result = [symbol] * 5
        elif random_chance < self.WINNING_ODDS["four_match"]:
            symbol = random.choice(self.symbols)
            result = [symbol] * 4 + [random.choice(self.symbols)]
        elif random_chance < self.WINNING_ODDS["three_match"]:
            symbol = random.choice(self.symbols)
            result = [symbol] * 3 + [random.choice(self.symbols) for _ in range(2)]
        else:
            result = [random.choice(self.symbols) for _ in range(5)]

        return result

    def find_matches(self, line):
        counts = {}
        max_count = 0

        for symbol in line:
            counts[symbol] = counts.get(symbol, 0) + 1
            max_count = max(max_count, counts[symbol])

        return max_count

    def calculate_line_win(self, matches, bet, line):
        multipliers = {
            1: {3: 5, 4: 10, 5: 100},
            2: {3: 2, 4: 5, 5: 100},
            3: {3: 2, 4: 5, 5: 100}
        }

        return bet * multipliers[line].get(matches, 0)

    def spin(self, bet, money):
        if money < bet:
            return {
                "error": "Insufficient funds"
            }

        result = {
            "line1": self.generate_spin_result(),
            "line2": self.generate_spin_result(),
            "line3": self.generate_spin_result()
        }

        total_win = 0
        for index, (line, symbols) in enumerate(result.items(), start=1):
            matches = self.find_matches(symbols)
            if matches >= 3:
                total_win += self.calculate_line_win(matches, bet, index)

        return {
            "result": result,
            "winAmount": total_win,
            "newBalance": money - bet + total_win
        }

slot_machine = SlotMachineLogic()

@app.route('/spin', methods=['POST'])
def spin():
    data = request.json
    bet = data.get("bet")
    money = data.get("money")

    if not bet or not money:
        return jsonify({"error": "Bet and money are required"}), 400

    result = slot_machine.spin(bet, money)
    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True)
