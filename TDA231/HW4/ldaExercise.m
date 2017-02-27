% -------------------------------------------------------------------
%
% This file is part of an exercise in the Machine Learning course of 
% Chalmers University of Technology
%
% Author: Fredrik Johansson (2013)
% 
% 
% This script runs LDA with a predetermined dataset, using the 
% parameters specified below.
%
% The script loads the word counts into the variable wordcount which 
% is a cell-array where each element is a struct representing a
% single document. Each struct has two fields, id and cnt. The field
% id specifies the id of each word that occurs in the document
% and cnt(i) the number of times word id(i) occurs in the document.
% 
% The script also loads the variable vocabulary comprising all the 
% words that occur in the corpus. The variable is a cell array
% in which each element is a string representing a word. 
% 
% -------------------------------------------------------------------

% --- Data import ---
wordcount = fmatrix('wordcount_nips_sparse.txt');
vocabulary = importdata('vocab_nips.txt');

% --- Pick a subset of the data (DO NOT MODIFY!)
seed = 0;
s = RandStream('mt19937ar','Seed',seed);
P = randperm(s,size(wordcount,2));
I = P(1:100);
wordcount = wordcount(I);

% --- Compute number of words (and remove unused words)
maxWord = 0;
for i=1:length(wordcount)
    maxWord = max(maxWord,max(wordcount{i}.id));
end

words = zeros(maxWord,1);
for dc = wordcount
    words(dc{:}.id) = 1;
end
C = [0; cumsum(1-words)];
nWords = 0;
for i = 1:length(wordcount)
    id = wordcount{i}.id;
    id = id-C(id)';
    wordcount{i}.id = id;
    c = max(id); 
    if(c>nWords);
        nWords = c;
    end
end
vocabulary(words<1) = [];


% -------------- YOU MAY MODIFY THESE SETTINGS -----------

% The number of topics
nTopics = 7;

% Parameter alpha
alpha = 50/nTopics;

% Parameter eta
eta = 0.1;

% Number of iterations
nIterations = 30;

% Number of iterations between each read of beta/theta
nReadIterations = 5; 

%Length of burn-in
nBurnIn = 20;

% -------------- YOU MAY MODIFY THE SETTINGS ABOVE -------



% --- Run LDA ---
[beta, theta] = ldaGibbs(wordcount, nTopics, alpha, eta, nIterations, ...
    nReadIterations, nBurnIn, nWords);

