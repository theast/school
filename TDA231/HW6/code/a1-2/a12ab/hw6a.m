load('medium_100_10k.mat');
k=10;
[idx,C,sumd, D] = kmeans(wordembeddings, k, 'Replicates', 1);

word_idx = cell(10,k);

for i=1:k
    for j=1:10
        [m, id] = min(D(:,i));
        D(id,i) = inf;
        word_idx(j,i) = vocab(id);
    end
end


