% -------------------------------------------------------------------
%
% This file is part of an exercise in the Machine Learning course of 
% Chalmers University of Technology
%
% Author: Fredrik Johansson (2013)
%
%
% ldaGibbs(data,nTopics,alpha,eta,nIt,nReadIt,
%          nBurnIn, nWords) 
% trains the LDA model based on wordcounts in data using nTopics 
% topics.
%
% data      A cell-array where each element is a sparse representation 
%           of the word count for a single document. Each cell has two
%           fields, id (representing word ids) and cnt (counts)
% nTopics   The number of topics to be used
% alpha     The parameter alpha
% eta       The parameter eta
% nIt       The number of Gibbs iterations to perform
% nReadIt   The number of iterations between parameter readouts
% nBurnIn   The number of iterations making up the burn-in
% nWords    The number of words in the vocabulary
% 
% -------------------------------------------------------------------

function [beta, theta] = ldaGibbs(data, nTopics, alpha, eta, ...
    nIt, nReadIt, nBurnIn, nWords)

% --- Variable declaration
nDocuments = length(data);
beta = zeros(nTopics, nWords);
theta = zeros(nDocuments,nTopics);

% ------- BELOW, YOU SHOULD IMPLEMENT THE GIBBS SAMPLER -------------
% ------- AND OUTPUT beta AND theta.                     -------------


% --- Initialization

N = zeros(nWords, nTopics);
M = zeros(nDocuments, nTopics);

betas = zeros(nTopics, nWords, (nIt-nBurnIn)/nReadIt);
thetas = zeros(nDocuments, nTopics, (nIt-nBurnIn)/nReadIt);
newBeta = zeros(nTopics, nWords);
newTheta = zeros(nDocuments, nTopics);

% Total words in all documents (Duplicate words in document) Assume that
% each duplicate of a word has the same topic in a document.
totalWords = 129459;

% Inital topic for every word.
Z = zeros(totalWords, 3);

% Random topics for all Words
randomTopics = randi(nTopics, totalWords, 1);
index = 1;

for doc=1:nDocuments   
    for word=1:length(data{doc}.id);
         for q=1:data{doc}.cnt(word)
                N(data{doc}.id(word), randomTopics(index, 1)) = N(data{doc}.id(word), randomTopics(index, 1)) + 1; 
                M(doc, randomTopics(index, 1)) = M(doc, randomTopics(index, 1)) + 1;
                Z(index, :) = [randomTopics(index, 1), doc, data{doc}.id(word)];
                index = index + 1;
        end
    end
end

% --- Inference, sampling Z

disp('init okay');
dlmwrite('nbefore.txt', N);
dlmwrite('mbefore.txt', M);

for i=1:nIt
    disp(sprintf('Sampling iteration: %d', i));    
    for word=1:totalWords 
        % Variables
        oldTopic = Z(word, 1);
        doc = Z(word, 2);
        id = Z(word, 3);
         
        % update count variables
        N(id, oldTopic) = N(id, oldTopic)-1;
        M(doc, oldTopic) = M(doc, oldTopic)-1;
        
        % Calculate probability for word for each topic
        probJ = zeros(1, nTopics);
        for topic=1:nTopics
            probJ(1, topic) = ((eta + N(id, topic))/(eta*nWords+sum(N(:,topic))))*...
                ((alpha + M(doc, topic))/(alpha*nTopics+sum(M(doc,:))));
        end
        
        newTopic = sample_discrete(normalise(probJ), 1, 1);
        Z(word,1) = newTopic;
        
        %update count variables
        N(id, newTopic) = N(id, newTopic)+1;
        M(doc, newTopic) = M(doc, newTopic)+1;
    end
    
    % estimate beta and theta
    if i > nBurnIn && mod(i, nReadIt) == 0  
        for t=1:nTopics 
            for w=1:nWords
                newBeta(t, w) = (N(w, t) + eta) / (sum(N(:,t)) + nWords*eta);
            end

            for d=1:nDocuments
                newTheta(d, t) = (M(d, t) + alpha) / (sum(M(d,:)) + alpha*nTopics);
            end
        end
        
        index = (i-nBurnIn)/nReadIt;
        betas(:,:,index) = newBeta;
        thetas(:,:,index) = newTheta;
    end 
    
end

beta = mean(betas, 3);
theta = mean(thetas, 3);


dlmwrite('nafter.txt', N);
dlmwrite('mafter.txt', M);
disp('Sampling complete');