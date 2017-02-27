function [ z_save_after, z_convergence, mu_first, mu] = k_means(k, x, save_after)
new_z = zeros(length(x),k);
z = zeros(length(x), k);
mu = zeros(k, 2);
euc_dist = @(p1, p2) (p1' - p2')'*(p1'-p2'); 

% Initialization
cluster_indices = randi(length(x), 1, k);
for i=1:k
   mu(i, :) = x(cluster_indices(i), :);
end 

mu_first = mu;

unchanged = false;
nIt = 0;
while ~unchanged
    for i=1:length(x)
       dist = [inf, 0];
        for j=1:k
           new_dist = euc_dist(x(i,:), mu(j,:));
            if  new_dist < dist(1)
               dist = [new_dist, j]; % which j does the dist belong to
            end   
        end
        new_z(i, :) = zeros(1, k); % remove previous cluster assignment
        new_z(i, dist(2)) = 1;
    end    
    
    % update all clusters
    for l=1:k
       nXinCluster = sum(new_z(:,l));
       new_mu = [0, 0];
       
       for m=1:length(x)
           if new_z(m, l) == 1
             new_mu = new_mu + x(m, :);
           end    
       end    
       
       new_mu = new_mu ./ nXinCluster;
       
       mu(l, :) = new_mu;
    end    
    
    % check if unchanged..
    if z == new_z
        unchanged = true;
    else 
        z = new_z;
    end    
    
    nIt = nIt + 1;
    
    if nIt == save_after
        z_save_after = z;
    end
end

z_convergence = z;
end

