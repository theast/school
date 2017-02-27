load('medium_100_10k');
clusters = kmeans(wordembeddings, 10);
rand_indices = randi(10000, 1000, 1);
points = wordembeddings(rand_indices, :); 

ydata = tsne(points, clusters(rand_indices), 2, 100);

figure
hold on;
markers = '+o*.xsd^v>';
color = 'ymcrgbk';

for i=1:length(ydata)
    curr_cluster = clusters(rand_indices(i));
    scatter(ydata(i, 1), ydata(i, 2), 30, markers(curr_cluster), color(mod(curr_cluster,7)+1));
end

hold off;
