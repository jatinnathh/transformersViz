import torch
import math

class Tokenizer:
    def __init__(self):
        self.dictionary = {}
        self.reverse_dictionary = {}
        self.__add_to_dict('<pad>')
        self.__add_to_dict('<unk>')
        # Full printable ASCII — handles Shakespeare's uppercase, punctuation, newlines
        for i in range(32, 127):
            self.__add_to_dict(chr(i))
        self.__add_to_dict('\n')

    def __add_to_dict(self, character):
        if character not in self.dictionary:
            self.dictionary[character] = len(self.dictionary)
            self.reverse_dictionary[self.dictionary[character]] = character

    def tokenize(self, text):
        unk = self.dictionary['<unk>']
        return [self.dictionary.get(c, unk) for c in text]

    def character_to_token(self, character):
        return self.dictionary[character]

    def token_to_character(self, token):
        return self.reverse_dictionary[token]

    def size(self):
        return len(self.dictionary)