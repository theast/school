f = zeros(10,1);
for m=1:10
    
load('medium_100_10k.mat');
k = 10;
id = 6033;

[idx,C,sumd, D] = kmeans(wordembeddings, k, 'Replicates', 1);

cluster = idx(id);

W0 = 0;
for i=1:length(idx)
    if idx(i) == cluster
        W0 = W0 + 1;
    end
end

C0 = zeros(W0,1);
N0 = nchoosek(W0,2);

i = 1;
for j=1:length(idx)
    if idx(j) == cluster
        C0(i) = j;
        i = i + 1; 
    end
end

[idx,C,sumd, D] = kmeans(wordembeddings, k, 'Replicates', 1);

N1 = 0;
for i=1:k
    W1 = 0;
    for j=1:length(idx)
        if idx(j) == i
            W1 = W1 + 1;
        end
    end
    
    C1 = zeros(W1,1);
    j = 1;
    for l=1:length(idx)
        if idx(l) == i
            C1(j) = l;
            j = j + 1; 
        end
    end
    
    W2 = sum(ismember(C0, C1));
    if W2 > 1
        N1 = N1 + nchoosek(W2,2);
    end

end

f(m) = N1/N0;

m

end

mean(f)