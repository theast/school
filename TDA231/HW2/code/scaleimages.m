function [ mu, mat ] = scaleimages( images )
[n,p] = size(images);
mat = zeros(n,32);

for i=1:n
    mat(i, :) = featurefunction(images(i, :)');
end

mu = sgeass22(mat);

end

