function [z] = k_means_rbf(k, x, sigma)

% init z
z = zeros(length(x), k);
cluster_ass = randi(k, length(x), 1);
for i=1:length(z)
   z(i, cluster_ass(i)) = 1; 
end    

new_z = z;

rbf = @(x1, x2) exp(-((x1'-x2')' * (x1'-x2'))/(2*sigma^2));

kernel = zeros(length(x), length(x));
zbig = zeros(length(x), length(x), k);

for i=1:length(x)
    for j=1:length(x)
        kernel(i, j) = rbf(x(i,:), x(j,:));
        for l=1:k
           zbig(i, j, l) = new_z(i, l) * new_z(j, l);
        end
    end
end

unchanged = false;
nIt = 0;
while ~unchanged
    for i=1:length(x)
        dist = zeros(1, k);
        for j=1:k
            N = 2*sum(new_z(:, j));
            dist(1, j) = kernel(i, i) - 2 * N^(-1) ...
                * kernel(i, :)*new_z(:, j) ...
              + N^(-2) * sum(sum(zbig(:,:,j) .* kernel));
        end
        [M, c_before] = max(new_z(i,:));
        new_z(i, c_before) = 0;
        zbig(i,:,c_before) = zeros(1,length(x));
        zbig(:,i,c_before) = zeros(length(x),1);
        
        [M, c_after] = min(dist);
        new_z(i, c_after) = 1;
        zbig(i,:,c_after) = new_z(:,c_after)';
        zbig(:,i,c_after) = new_z(:,c_after);
    end
    
    nIt = nIt +1;
    if z == new_z
        unchanged = true;
    else 
        z = new_z;
    end
end

nIt
end

